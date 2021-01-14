import firebase from "firebase/app";

/**
 * Creates a new icca boundary - optionally pass in an id to retry creation of an existing boundary.
 */
export function createBoundary(id, metadata, geojson) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("Not Authorized");

  // For new boundaries, set createdAt
  if (!id) metadata.createdAt = firebase.firestore.FieldValue.serverTimestamp();

  const db = firebase.firestore();
  // If id is set, this is a retry, so we replace the values, otherwise this
  // will create a new document
  const iccasRef = db.collection(`groups/${user.uid}/iccas`);
  const iccaRef = id ? iccasRef.doc(id) : iccasRef.doc();

  return iccaRef.set({ ...metadata, geojson });
}
