const functions = require("firebase-functions");
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
  async (req, res, { groupId, iccaId }) => {
    try {
      const ref = admin
        .firestore()
        .collection("groups")
        .doc(groupId)
        .collection("iccas")
        .doc(iccaId);
      const doc = await ref.get();
      const icca = doc.data();
      delete icca.public
      icca.geojson = JSON.parse(icca.geojson);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(icca));
    } catch (e) {
      functions.logger.error(e);
      res.statusCode = 500;
      res.end();
    }
  }
);

exports.api = functions.https.onRequest((req, res) => {
  router.lookup(req, res);
});
