import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* LOAD SETTINGS */
export async function loadSettings(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  return snap.exists() ? snap.data().settings : {};
}

/* SAVE SETTINGS */
export async function saveSettings(uid, settings) {
  await setDoc(
    doc(db, "users", uid),
    {
      settings,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}