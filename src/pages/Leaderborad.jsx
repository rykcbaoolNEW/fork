import { useEffect, useState } from "react";
import Nav from "../layouts/Nav";
import Footer from "../components/Footer";
import { getLeaderboard } from "../utils/leaderboard";

export default function Leaderboard() {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    setBoard(getLeaderboard());
  }, []);

  return (
    <>
      <Nav />

      <div style={{ padding: 30, color: "white" }}>
        <h1>Leaderboard</h1>

        {board.length === 0 ? (
          <p>No data yet</p>
        ) : (
          board.map((u, i) => (
            <div key={u.username} style={row}>
              <b>#{i + 1}</b> {u.username} —{" "}
              {Math.floor(u.totalTimeMs / 60000)} min — {u.sessions} sessions
            </div>
          ))
        )}
      </div>

      <Footer />
    </>
  );
}

const row = {
  padding: 10,
  marginTop: 8,
  background: "#111827",
  borderRadius: 8,
};