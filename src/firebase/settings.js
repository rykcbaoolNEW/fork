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

/* SAVE SETTINGS + USERNAME */
export async function saveSettings(uid, settings, username = null) {
  const cleaned = stripWispConfig(settings);

  const updateData = {
    settings: cleaned,
    updatedAt: Date.now()
  };

  // only store username if provided
  if (username) {
    updateData.username = username;
  }

  await setDoc(doc(db, "users", uid), updateData, { merge: true });
}
