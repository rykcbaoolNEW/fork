import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCreLSnY7Lzw9voKZINe4PVTQyFa4w6wHQ",
  authDomain: "dogeub-autosave.firebaseapp.com",
  projectId: "dogeub-autosave",
  storageBucket: "dogeub-autosave.firebasestorage.app",
  messagingSenderId: "371168003074",
  appId: "1:371168003074:web:fc786f9ef0c68f4cd1d31b",
  measurementId: "G-YKV6QJVN5C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics is optional, but it gives us some insights into usage
const analytics = getAnalytics(app);

// this is what we use in the rest of the app, import { db, auth } from "./firebase";w
export const db = getFirestore(app);
export const auth = getAuth(app);




// keep user logged in after refresh
setPersistence(auth, browserLocalPersistence);