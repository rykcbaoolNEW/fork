import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase/firebase";
import { addSessionTime } from "../services/userStats";

export default function useTimeTracker() {
  const startTime = useRef(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const flushTime = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const sessionTime = Date.now() - startTime.current;

      if (sessionTime > 1000) {
        await addSessionTime(user.uid, sessionTime);
      }

      setTimeSpent((prev) => prev + sessionTime);
      startTime.current = Date.now();
    };

    const interval = setInterval(flushTime, 30000);

    const handleUnload = () => {
      flushTime();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      flushTime();
    };
  }, []);

  return timeSpent;
}