import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Nav from "../layouts/Nav";
import Footer from "../components/Footer";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u && !u.isAnonymous) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      }
    });

    return () => unsub();
  }, []);

  // 🔥 NOT LOGGED IN OR ANONYMOUS
  if (!user || user.isAnonymous) {
    return (
      <>
        <Nav />
        <div style={{ color: "white", padding: 40 }}>
          Not logged in.
        </div>
        <Footer />
      </>
    );
  }

  // 🔥 LOADING PROFILE DATA
  if (!profile) {
    return (
      <>
        <Nav />
        <div style={{ color: "white", padding: 40 }}>
          Loading...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />

      <div style={wrap}>
        <div style={card}>
          <h1>Profile</h1>

          <p>Username: {profile.username}</p>
          <p>UID: {user.uid}</p>

          <button style={btn} onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

const wrap = {
  minHeight: "90vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
};

const card = {
  background: "#111827",
  padding: 30,
  borderRadius: 12,
  width: 350,
};

const btn = {
  marginTop: 10,
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
};