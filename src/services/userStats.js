import { db } from "../firebase/firebase";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";


/* -------------------------------
   LOAD USER PROFILE
-------------------------------- */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) return null;

  return snap.data();
}

/* -------------------------------
   CREATE OR ENSURE USER EXISTS
-------------------------------- */
export async function ensureUser(uid, username = "") {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      username,
      createdAt: Date.now(),
      stats: {
        totalTimeMs: 0,
        sessions: 0,
        lastSeen: Date.now(),
      },
    });
  }
}

/* -------------------------------
   ADD SESSION TIME (SAFE)
-------------------------------- */
export async function addSessionTime(uid, timeMs) {
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  // 👇 auto-create if missing (prevents crashes)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      createdAt: Date.now(),
      stats: {
        totalTimeMs: timeMs,
        sessions: 1,
        lastSeen: Date.now(),
      },
    });
    return;
  }

  await updateDoc(ref, {
    "stats.totalTimeMs": increment(timeMs),
    "stats.sessions": increment(1),
    "stats.lastSeen": Date.now(),
  });
}

/* -------------------------------
   LEADERBOARD
-------------------------------- */
export async function getLeaderboard(limitCount = 10) {
  const q = query(
    collection(db, "users"),
    orderBy("stats.totalTimeMs", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
  }));
}