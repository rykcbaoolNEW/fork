import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

const OptionsContext = createContext();

const getStoredOptions = () => {
  try {
    return JSON.parse(localStorage.getItem("options") || "{}");
  } catch {
    return {};
  }
};

export const OptionsProvider = ({ children }) => {
  const [options, setOptions] = useState(getStoredOptions);

  const [user, setUser] = useState(null);

  //  login
  useEffect(() => {
    signInAnonymously(auth);

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  // load from firebase when user exists
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists()) {
        const remoteOptions = snap.data().options || {};

        setOptions((prev) => ({
          ...prev,
          ...remoteOptions,
        }));

        // also cache locally
        localStorage.setItem("options", JSON.stringify(remoteOptions));
      }
    };

    load();
  }, [user]);

  //  auto-save to localStorage + Firebase
  const updateOption = useCallback(
    (obj, immediate = true) => {
      if (!obj || typeof obj !== "object") return;

      const updated = {
        ...getStoredOptions(),
        ...obj,
      };

      // local cache (instant)
      localStorage.setItem("options", JSON.stringify(updated));

      if (immediate) {
        setOptions((prev) => ({ ...prev, ...obj }));
      }

      // cloud sync
      if (user) {
        setDoc(
          doc(db, "users", user.uid),
          { options: updated },
          { merge: true }
        );
      }
    },
    [user]
  );

  const contextValue = useMemo(
    () => ({ options, updateOption }),
    [options, updateOption]
  );

  return (
    <OptionsContext.Provider value={contextValue}>
      {children}
    </OptionsContext.Provider>
  );
};

export const useOptions = () => {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error("useOptions must be used within an OptionsProvider");
  }
  return context;
};