import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function stripWispConfig(settings = {}) {
  const { wispConfig, wisp, wispSettings, ...clean } = settings;
  return clean;
}

/* LOAD SETTINGS */
export async function loadSettings(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  return snap.exists() ? snap.data().settings : {};
}

/* SAVE SETTINGS */
export async function saveSettings(uid, settings) {
  const cleaned = stripWispConfig(settings);

  await setDoc(
    doc(db, "users", uid),
    {
      settings: cleaned,
      updatedAt: Date.now()
    },
    { merge: true }
  );
}