import { useEffect, useRef } from "react";
import { auth } from "../firebase/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function useSecondSync() {
  const lastTick = useRef(Date.now());

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    const interval = setInterval(async () => {
      const now = Date.now();
      const delta = now - lastTick.current;

      lastTick.current = now;

      // add ~1 second (or actual delta)
      await updateDoc(ref, {
        "stats.totalTimeMs": increment(delta),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
}