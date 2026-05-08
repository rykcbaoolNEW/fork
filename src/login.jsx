import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";

const provider = new GoogleAuthProvider();

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // if already logged in, redirect
 useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {

  });

  return () => unsub();
}, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign In</h1>
        <p style={styles.subtitle}>
          Sign in to sync your settings across all links
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white",
  },
  card: {
    padding: "40px",
    borderRadius: "12px",
    background: "#111827",
    textAlign: "center",
    width: "320px",
  },
  title: {
    fontSize: "24px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "14px",
    opacity: 0.7,
    marginBottom: "20px",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
  },
};