import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const ALLOWED_USERNAME = "ryk_cool";

  /* AUTH */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  if (!user) return <div>Login required</div>;

  if (user.displayName !== ALLOWED_USERNAME) {
    return <div>Access denied</div>;
  }
  
  /* LOAD ALL LINKS */
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "links"));

      setLinks(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );
    };

    load();
  }, []);

  /* UPDATE LINK */
  async function togglePassword(id, value) {
    await updateDoc(doc(db, "links", id), {
      passwordEnabled: value
    });
  }

  /* DELETE LINK */
  async function removeLink(id) {
    await deleteDoc(doc(db, "links", id));
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  if (!user) return <div>Login required</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      {links.map(link => (
        <div key={link.id} style={{ border: "1px solid #444", padding: 10, marginBottom: 10 }}>
          <h3>{link.id}</h3>

          <p>Owner: {link.owner || "none"}</p>

          <label>
            <input
              type="checkbox"
              checked={link.passwordEnabled}
              onChange={(e) => togglePassword(link.id, e.target.checked)}
            />
            Password Enabled
          </label>

          <button onClick={() => removeLink(link.id)} style={{ marginLeft: 10 }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
