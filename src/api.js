import firebase from "firebase/app";

/**
 * Creates a new icca boundary - optionally pass in an id to retry creation of
 * an existing boundary.
 */
export function createBoundary(metadata, feature) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Not Authorized");

  const db = firebase.firestore();
  // If id is set, this is a retry, so we replace the values, otherwise this
  // will create a new document
  const iccasRef = db.collection(`groups/${user.uid}/iccas`);
  const {id, type, properties, geometry } = feature
  const iccaRef = iccasRef.doc(id)

  return iccaRef.set({
    metadata,
    type,
    properties,
    geometry: JSON.stringify(geometry),
    uploaded: firebase.firestore.FieldValue.serverTimestamp(),
    public: false
  });
}
