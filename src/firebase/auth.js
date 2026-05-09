import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export function initAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Authentication failed. Please try again.");
      return;
    }

    callback(user); // gives uid
  });
}