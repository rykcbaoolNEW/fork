import { useEffect, useState } from "react";
import Nav from "../layouts/Nav";
import Footer from "../components/Footer";
import useSecondSync from "../hooks/useSecondSync";

export default function Profile() {

  useSecondSync();

  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (!savedUsername) return;

    setUsername(savedUsername);

    // load saved time
    const data = JSON.parse(localStorage.getItem("sessionData")) || {};
    const userStats = data[savedUsername];

    const initialSeconds = Math.floor((userStats?.totalTimeMs || 0) / 1000);
    setSeconds(initialSeconds);

    // live counter
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (!username) {
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

  return (
    <>
      <Nav />

      <div style={wrap}>
        <div style={card}>
          <h1>Profile</h1>
         

          <p>Username: {username}</p>
          <p>More coming soon...</p>
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