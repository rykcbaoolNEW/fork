import Routing from './Routing';
import ReactGA from 'react-ga4';
import Search from './pages/Search';
import lazyLoad from './lazyWrapper';
import NotFound from './pages/NotFound';
import Background from './layouts/Background';

import { useEffect, useMemo, memo, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

import Popunder from './components/Popunder';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import { initPreload } from './utils/preload';
import { designConfig as bgDesign } from './utils/config';

import useReg from './utils/hooks/loader/useReg';
import usePopunderStore from './utils/hooks/popunder/usePopunderStore';
import { validateAdKey } from './utils/hooks/popunder/validateAdKey';

import './index.css';
import 'nprogress/nprogress.css';

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { isAdmin } from "./utils/isAdmin";

/* ================= LAZY PAGES ================= */
const Login = lazyLoad(() => import('./pages/login'));
const Profile = lazyLoad(() => import('./pages/Profile'));

const Home = lazyLoad(() => import('./pages/Home'));
const Apps = lazyLoad(() => import('./pages/Apps'));
const Apps2 = lazyLoad(() => import('./pages/Apps2'));
const Settings = lazyLoad(() => import('./pages/Settings'));
const Player = lazyLoad(() => import('./pages/Player'));
const Admin = lazyLoad(() => import('./pages/Admin'));
const NotFoundPage = NotFound;

/* ================= PRELOAD ================= */
initPreload('/materials', () => import('./pages/Apps'));
initPreload('/docs', () => import('./pages/Apps2'));
initPreload('/settings', () => import('./pages/Settings'));
initPreload('/', () => import('./pages/Home'));

/* ================= TRACKING ================= */
function useTracking() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);
}

/* ================= MAIN APP ================= */
const ThemedApp = memo(() => {
  const { options, updateOption } = useOptions();
  const location = useLocation();

  const domain = window.location.hostname;

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [domainConfig, setDomainConfig] = useState(null);
  const [domainUnlocked, setDomainUnlocked] = useState(false);

  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");

  const isAdminRoute = location.pathname === "/admin";

  const popunderEnabled = POPUNDER_ENABLED === 'true';
  const adKeyPassed = usePopunderStore((s) => s.adKeyPassed);
  const setAdKeyPassed = usePopunderStore((s) => s.setAdKeyPassed);

  useReg();
  useTracking();

  /* ================= AUTH (HOOK) ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });

    return () => unsub();
  }, []);

  /* ================= LOAD DOMAIN ================= */
  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "links", domain);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const newData = {
          passwordEnabled: false,
          passwordHash: "",
          createdAt: Date.now(),
          owner: null
        };

        await setDoc(ref, newData);
        setDomainConfig(newData);
        return;
      }

      setDomainConfig(snap.data());
    };

    load();
  }, [domain]);

  /* ================= POPUNDER ================= */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const key =
        options.adKeyInput?.trim() ||
        options.adKey?.trim() ||
        '';

      if (!key) {
        if (!cancelled) setAdKeyPassed(false);
        return;
      }

      const valid = await validateAdKey(key);
      if (cancelled) return;

      setAdKeyPassed(valid);

      if (valid && options.adKey !== key) {
        updateOption({ adKey: key, adKeyInput: key });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [options.adKey, options.adKeyInput]);

  /* ================= PASSWORD CHECK ================= */
  async function unlock() {
    const snap = await getDoc(doc(db, "links", domain));

    if (!snap.exists()) return;

    const data = snap.data();

    if (inputPassword === data.passwordHash) {
      setDomainUnlocked(true);
      setError("");
    } else {
      setError("Wrong password");
    }
  }

  /* ================= ROUTES ================= */
  const pages = useMemo(() => [
    { path: '/', element: <Home /> },
    { path: '/materials', element: <Apps /> },
    { path: '/docs', element: <Apps2 /> },
    { path: '/docs/r', element: <Player /> },
    { path: '/search', element: <Search /> },
    { path: '/settings', element: <Settings /> },
    { path: '/login', element: <Login /> },
    { path: '/profile', element: <Profile /> },
    { path: '*', element: <NotFoundPage /> },
  ], []);

  /* ================= BACKGROUND ================= */
  const backgroundStyle = useMemo(() => {
    const bg =
      options.bgDesign === 'None'
        ? 'none'
        : (
            bgDesign.find((d) => d.value.bgDesign === options.bgDesign) ||
            bgDesign[0]
          ).value.getCSS?.(options.bgDesignColor || '102,105,109') || 'none';

    return `
      body {
        color: ${options.siteTextColor || '#a0b0c8'};
        background-image: ${bg};
        background-color: ${options.bgColor || '#111827'};
      }
    `;
  }, [options]);

  /* ================= SAFE RENDER FLOW ================= */

  if (loadingAuth) return <div>Loading...</div>;
  if (!domainConfig) return <div>Loading site...</div>;

  /* ================= ADMIN ROUTE (SAFE HERE) ================= */
  if (isAdminRoute) {
    if (!isAdmin(user)) return <Navigate to="/" />;
    return <Admin />;
  }

  /* ================= PASSWORD GATE ================= */
  if (domainConfig.passwordEnabled && !domainUnlocked) {
    return (
  <div style={{ padding: 20 }}>
    <Background>
      <h2>Protected Link</h2>

      <input
        type="password"
        value={inputPassword}
        onChange={(e) => setInputPassword(e.target.value)}
      />

      <button onClick={unlock}>Unlock</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </Background>
  </div>
);
  }

  /* ================= MAIN APP ================= */
  return (
    <>
      <Routing pages={pages} />
      {popunderEnabled && !adKeyPassed ? <Popunder /> : null}
      <style>{backgroundStyle}</style>
    </>
  );
});

/* ================= WRAPPER ================= */
export default function App() {
  return (
    <OptionsProvider>
      <ThemedApp />
    </OptionsProvider>
  );
}
