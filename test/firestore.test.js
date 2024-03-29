const tape = require("tape");
const fs = require("fs");
const firebase = require("@firebase/rules-unit-testing");
const _test = require("tape-promise").default;
const test = _test(tape);

const projectId = "mapeo-icca-boundaries";
// const coverageUrl = `http://localhost:8080/emulator/v1/projects/${projectId}:ruleCoverage.html`;

const rules = fs.readFileSync("firestore.rules", "utf8");

async function getDb(auth, data) {
  const testApp = await firebase.initializeTestApp({ projectId, auth });
  const adminApp = await firebase.initializeAdminApp({ projectId });
  await firebase.clearFirestoreData({ projectId });
  const adminDb = adminApp.firestore();

  // Write mock documents before rules
  if (data) {
    // eslint-disable-next-line no-unused-vars
    for (const key in data) {
      const ref = adminDb.doc(key);
      await ref.set(data[key]);
    }
  }

  await firebase.loadFirestoreRules({ projectId, rules });
  return testApp.firestore();
}

const assertFails = (t) => (get, msg) =>
  t.doesNotReject(firebase.assertFails(get), msg);
const assertSucceeds = (t) => (get, msg) =>
  t.doesNotReject(firebase.assertSucceeds(get), msg);

test("Anonymous user read", async function (t) {
  const fixture = {
    "groups/1": { foo: "bar", public: true },
    "groups/1/iccas/1": { foo: "bar", public: true },
    "groups/1/iccas/2": { qux: "baz" },
  };
  const db = await getDb(null, fixture);

  // Maps
  await assertSucceeds(t)(
    db.collection("groups/1/iccas").where("public", "==", true).get(),
    "Can read list of public maps"
  );
  await assertFails(t)(
    db.collection("groups/1/iccas").get(),
    "Reading all records fails"
  );
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/1").get(),
    "Can read public record"
  );
  await assertFails(t)(
    db.doc("groups/1/iccas/2").get(),
    "Cannot read non-public record"
  );

  // Groups
  await assertFails(t)(
    db.collection("groups").get(),
    "Cannot read list of groups"
  );
  await assertFails(t)(
    db.doc("groups/1").get(),
    "Cannot read single group record"
  );

  t.end();
});

test("Anonymous user update", async function (t) {
  const fixture = {
    "groups/1": { foo: "bar", public: true },
    "groups/1/iccas/1": { foo: "bar", public: true },
    "groups/1/iccas/2": { qux: "baz" },
  };
  const db = await getDb(null, fixture);

  // Maps
  await assertFails(t)(
    db.doc("groups/1/iccas/1").set({}),
    "Cannot update public record"
  );
  await assertFails(t)(
    db.doc("groups/1/iccas/2").set({}),
    "Cannot update non-public record"
  );

  // Groups
  await assertFails(t)(
    db.doc("groups/1").set({}),
    "Cannot update single group record"
  );

  t.end();
});

test("Anonymous user delete", async function (t) {
  const fixture = {
    "groups/1": { foo: "bar", public: true },
    "groups/1/iccas/1": { foo: "bar", public: true },
    "groups/1/iccas/2": { qux: "baz" },
  };
  const db = await getDb(null, fixture);

  // Maps
  await assertFails(t)(
    db.doc("groups/1/iccas/1").delete(),
    "Cannot update public record"
  );
  await assertFails(t)(
    db.doc("groups/1/iccas/2").delete(),
    "Cannot update non-public record"
  );

  // Groups
  await assertFails(t)(
    db.doc("groups/1").delete(),
    "Cannot update single group record"
  );

  t.end();
});

test("Anonymous user create", async function (t) {
  const db = await getDb(null, {
    "groups/1": {},
    "groups/1/iccas/1": { public: true },
  });

  // Maps
  await assertFails(t)(
    db.collection("groups/1/iccas").add({}),
    "Cannot create ICCA boundary"
  );

  // Groups
  await assertFails(t)(
    db.collection("groups").add({}),
    "Cannot create single group record"
  );

  t.end();
});

test("Logged-in user read", async function (t) {
  const fixture = {
    "groups/1": { foo: "bar", public: true },
    "groups/1/iccas/1": { foo: "bar", public: true },
    "groups/1/iccas/2": { qux: "baz" },
    "groups/2/iccas/1": { foo: "bar2", public: true },
    "groups/2/iccas/2": { qux: "baz2" },
  };
  const db = await getDb({ uid: "1" }, fixture);

  // Maps
  await assertSucceeds(t)(
    db.collection("groups/1/iccas").get(),
    "Can read list of all own maps"
  );
  await assertSucceeds(t)(
    db.collection("groups/2/iccas").where("public", "==", true).get(),
    "Can read list of public iccas"
  );
  await assertFails(t)(
    db.collection("groups/2/iccas").get(),
    "Cannot read all iccas of other user"
  );
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/1").get(),
    "Can read own public record"
  );
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/2").get(),
    "Can read own non-public record"
  );
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/1").get(),
    "Can read other's public record"
  );
  await assertFails(t)(
    db.doc("groups/2/iccas/2").get(),
    "Cannot read other's non-public record"
  );

  // Groups
  await assertFails(t)(
    db.collection("groups").get(),
    "Cannot read list of groups"
  );
  await assertSucceeds(t)(
    db.doc("groups/1").get(),
    "Can read own group record"
  );

  t.end();
});

test("Logged-in user update", async function (t) {
  const fixture = {
    "groups/1": { foo: "bar", public: true },
    "groups/1/iccas/1": { foo: "bar", public: true },
    "groups/1/iccas/2": { qux: "baz" },
    "groups/2/iccas/1": { foo: "bar2", public: true },
    "groups/2/iccas/2": { qux: "baz2" },
  };
  const db = await getDb({ uid: "1" }, fixture);

  // Maps
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/1").set({}),
    "Can update public record"
  );
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/2").set({}),
    "Can update non-public record"
  );
  await assertFails(t)(
    db.doc("groups/2/iccas/1").set({}),
    "Cannot update other's record"
  );

  // Groups
  await assertSucceeds(t)(
    db.doc("groups/1").set({}),
    "Can update own group record"
  );
  await assertFails(t)(
    db.doc("groups/2").set({}),
    "Cannot update other's group record"
  );

  t.end();
});

test("Logged-in user delete", async function (t) {
  const fixture = {
    "groups/1": { foo: "bar", public: true },
    "groups/1/iccas/1": { foo: "bar", public: true },
    "groups/1/iccas/2": { qux: "baz" },
    "groups/2/iccas/1": { foo: "bar2", public: true },
    "groups/2/iccas/2": { qux: "baz2" },
  };
  const db = await getDb({ uid: "1" }, fixture);

  // Maps
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/1").delete(),
    "Can update public record"
  );
  await assertSucceeds(t)(
    db.doc("groups/1/iccas/2").delete(),
    "Can update non-public record"
  );
  await assertFails(t)(
    db.doc("groups/2/iccas/1").delete(),
    "Cannot update other's record"
  );

  // Groups
  await assertSucceeds(t)(
    db.doc("groups/1").delete(),
    "Can update own group record"
  );
  await assertFails(t)(
    db.doc("groups/2").delete(),
    "Cannot update other's group record"
  );

  t.end();
});

test("Logged-in user create", async function (t) {
  const db = await getDb(
    { uid: "1" },
    {
      "groups/1": {},
      "groups/1/iccas/1": { public: true },
    }
  );

  // Maps
  await assertSucceeds(t)(
    db.collection("groups/1/iccas").add({}),
    "Can create map in own group"
  );
  await assertFails(t)(
    db.collection("groups/2/iccas").add({}),
    "Cannot create map in other's group"
  );

  // Groups
  await assertFails(t)(
    db.collection("groups").add({}),
    "Cannot create single group record"
  );

  t.end();
});

test("cleanup", async (t) => {
  await t.doesNotReject(
    Promise.all(firebase.apps().map((app) => app.delete()))
  );
  t.end();
});
