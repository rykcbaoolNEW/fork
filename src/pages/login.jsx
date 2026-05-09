import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Nav from "../layouts/Nav";
import Footer from "../components/Footer";

import { auth, db } from "../firebase/firebase";


import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

import { useOptions } from "../utils/optionsContext";

const Login = () => {
  const navigate = useNavigate();
  const { options } = useOptions();

  const [hover, setHover] = useState(false);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const textColor = options.siteTextColor ?? "#a0b0c8";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        navigate("/");
      }
    });

    return () => unsub();
  }, [navigate]);

  const handleAuth = async () => {
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      const email = `${username}@gmail.com`;

      /* ---------------- REGISTER ---------------- */
      if (isRegister) {
        const q = query(
          collection(db, "users"),
          where("username", "==", username)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          alert("Username already taken");
          setLoading(false);
          return;
        }

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const user = result.user;

        // ✅ create full profile safely
        await createUserIfMissing(user.uid, username);

        // optional extra fields (safe merge)
        await setDoc(
          doc(db, "users", user.uid),
          {
            username,
            email,
            lastLogin: Date.now(),
          },
          { merge: true }
        );

        localStorage.setItem("username", username);

        navigate("/");
      }

      /* ---------------- LOGIN ---------------- */
      else {
        await signInWithEmailAndPassword(auth, email, password);

        const user = auth.currentUser;

        // ensure profile exists
        await createUserIfMissing(user.uid, username);

        // update last login
        await setDoc(
          doc(db, "users", user.uid),
          {
            lastLogin: Date.now(),
          },
          { merge: true }
        );

        localStorage.setItem("username", username);

        alert("Logged in successfully");

        navigate("/");
      }
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <>
      <Nav />

      <div
        style={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: textColor,
          padding: "20px",
        }}
      >
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            background: "#111827",
            padding: "40px",
            borderRadius: "18px",
            width: "420px",
            maxWidth: "95vw",
            boxShadow: hover
              ? "0 25px 70px rgba(0,0,0,0.65)"
              : "0 10px 30px rgba(0,0,0,0.4)",
            transform: hover ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          <h1 style={{ marginBottom: "20px", fontSize: "22px" }}>
            {isRegister ? "Create Account" : "Sign In"}
          </h1>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 10 }}>
            Warning! Settings sync across devices using Firebase.
          </div>

          <button onClick={handleAuth} style={buttonStyle}>
            {loading
              ? "Loading..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>

          <p
            onClick={() => setIsRegister(!isRegister)}
            style={{
              marginTop: "12px",
              cursor: "pointer",
              opacity: 0.7,
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {isRegister
              ? "Already have an account? Sign in"
              : "No account? Create one"}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "none",
  outline: "none",
  fontSize: "14px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "14px",
};


export default Login;