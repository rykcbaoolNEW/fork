import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

export function initAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      await signInAnonymously(auth);
      return;
    }

    callback(user); // gives uid
  });
}