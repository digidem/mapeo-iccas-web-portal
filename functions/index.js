/* eslint-disable consistent-return */
/* eslint-disable prefer-arrow-callback */
const functions = require("firebase-functions");
const url = require("url");
const mailjet = require("node-mailjet").connect(
  functions.config().mailjet.key,
  functions.config().mailjet.secret
);
const router = require("find-my-way")({
  defaultRoute: (req, res) => {
    res.statusCode = 404;
    res.end();
  },
});

// The Firebase Admin SDK to access Firestore.
const admin = require("firebase-admin");
admin.initializeApp();

router.get(
  "/api/groups/:groupId/iccas/:iccaId",
  async function (req, res, { groupId, iccaId }) {
    try {
      const ref = admin
        .firestore()
        .collection("groups")
        .doc(groupId)
        .collection("iccas")
        .doc(iccaId);
      const data = await getIcca(ref);
      if (!data) {
        res.statusCode = 404;
        res.end();
        return;
      }
      data.url = `${this.origin}${this.pathname}?access_token=${this.query.access_token}`;
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(data));
    } catch (e) {
      functions.logger.error(e);
      res.statusCode = 500;
      res.end();
    }
  }
);

router.get("/api/iccas", async function (req, res) {
  try {
    const since = Number.parseInt(this.query.since);
    let sinceTimestamp = admin.firestore.Timestamp.fromDate(new Date(0));
    if (!Number.isNaN(since)) {
      sinceTimestamp = admin.firestore.Timestamp.fromDate(new Date(since));
    }
    const ref = admin
      .firestore()
      .collectionGroup("iccas")
      .where("uploaded", ">=", sinceTimestamp);
    const snap = await ref.get();
    const data = await Promise.all(
      snap.docs.map(async (doc) => {
        const icca = await getIcca(doc.ref);
        icca.url = `${this.origin}/api/${doc.ref.path}?access_token=${this.query.access_token}`;
        return icca;
      })
    );
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data));
  } catch (e) {
    functions.logger.error(e);
    res.statusCode = 500;
    res.end();
  }
});

async function getIcca(ref) {
  const snap = await ref.get();
  const icca = snap.data();
  if (!icca) return;
  return transformIcca(icca);
}

function transformIcca(icca) {
  const {
    metadata,
    type,
    properties: { id, ...properties },
    geometry,
  } = icca;
  return {
    id,
    submissionMetadata: metadata,
    uploaded: icca.uploaded.toDate().toISOString(),
    geojson: {
      type,
      properties,
      geometry: JSON.parse(geometry),
    },
  };
}

exports.api = functions.https.onRequest((req, res) => {
  try {
    const url = new URL(
      `${req.headers["x-forwarded-proto"] || "http"}://${
        req.headers["x-forwarded-host"]
      }/${req.url}`
    );
    const accessToken = url.searchParams.get("access_token");
    if (!accessToken || accessToken !== functions.config().mapeo.token) {
      res.statusCode = 401;
      res.end();
      return;
    }
    router.lookup(req, res, {
      query: Object.fromEntries(url.searchParams.entries()),
      pathname: url.pathname,
      origin: url.origin,
    });
  } catch (e) {
    functions.logger.error(e);
    res.statusCode = 500;
    res.end();
  }
});

exports.onIccaWrite = functions.firestore
  .document("groups/{groupId}/iccas/{iccaId}")
  .onWrite(async (change, context) => {
    const action = change.before.exists
      ? change.after.exists
        ? "update"
        : "delete"
      : "create";
    if (action === "delete") return;

    const eventId = context.eventId;
    const emailRef = admin.firestore().collection("sentEmails").doc(eventId);
    if (!(await shouldSend(emailRef))) return;

    const icca = transformIcca(change.after.data());
    const { groupId, iccaId } = context.params;
    await sendEmail({ action, icca, groupId, iccaId });
    await markSent(emailRef);
  });

function shouldSend(emailRef) {
  return emailRef.get().then((emailDoc) => {
    return !emailDoc.exists || !emailDoc.data().sent;
  });
}

function markSent(emailRef) {
  return emailRef.set({ sent: true });
}

async function sendEmail({ action, icca, groupId, iccaId }) {
  const subject = action === "create" ? "New ICCA created" : "ICCA was updated";
  const intro =
    action === "create"
      ? "A new ICCA was uploaded to the Mapeo for ICCAs database with the following submission data:"
      : `ICCA id ${icca.id} was updated in the Mapeo for ICCAs database with the following submission data:`;
  const metadataTable = Object.entries(icca.submissionMetadata)
    .map((entry) => entry.join(": "))
    .join("\n");
  return mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "noreply@mapeo.app",
          Name: "Mapeo for ICCAs",
        },
        To: [
          {
            Email: functions.config().mapeo.email,
            Name: functions.config().mapeo.name,
          },
        ],
        Subject: subject,
        TextPart: `${intro}

${metadataTable}

API access: https://iccas.mapeo.app/api/groups/${groupId}/iccas/${iccaId}?access_token=${
          functions.config().mapeo.token
        }

The ICCA boundary is attached as a GeoJSON document.

`,
        CustomID: "AppGettingStartedTest",
        Attachments: [
          {
            ContentType: "application/json; charset=utf-8",
            Filename: `icca_${icca.id}.geojson`,
            Base64Content: Buffer.from(
              JSON.stringify(icca.geojson, null, 2)
            ).toString("base64"),
          },
        ],
      },
    ],
  });
}
