import Routing from './Routing';
import ReactGA from 'react-ga4';
import Search from './pages/Search';
import lazyLoad from './lazyWrapper';
import NotFound from './pages/NotFound';
import { useEffect, useMemo, memo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Popunder from './components/Popunder';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import { initPreload } from './utils/preload';
import { designConfig as bgDesign } from './utils/config';
import useReg from './utils/hooks/loader/useReg';
import usePopunderStore from './utils/hooks/popunder/usePopunderStore';
import { validateAdKey } from './utils/hooks/popunder/validateAdKey';
import './index.css';
import 'nprogress/nprogress.css';

import { auth } from './firebase/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

/* ================= LAZY PAGES ================= */
const Login = lazyLoad(() => import('./pages/Login'));
const Profile = lazyLoad(() => import('./pages/Profile'));

const Home = lazyLoad(() => import('./pages/Home'));
const Apps = lazyLoad(() => import('./pages/Apps'));
const Apps2 = lazyLoad(() => import('./pages/Apps2'));
const Settings = lazyLoad(() => import('./pages/Settings'));
const Player = lazyLoad(() => import('./pages/Player'));

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

/* ================= THEMED APP ================= */
const ThemedApp = memo(() => {
  const { options, updateOption } = useOptions();

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const popunderEnabled = POPUNDER_ENABLED === 'true';
  const adKeyPassed = usePopunderStore((s) => s.adKeyPassed);
  const setAdKeyPassed = usePopunderStore((s) => s.setAdKeyPassed);

  useReg();
  useTracking();

  /* AUTH */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });

    return () => unsub();
  }, []);

  /* POPUNDER VALIDATION */
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

  /* ROUTES */
  const pages = useMemo(
    () => [
      { path: '/', element: <Home /> },
      { path: '/materials', element: <Apps /> },
      { path: '/docs', element: <Apps2 /> },
      { path: '/docs/r', element: <Player /> },
      { path: '/search', element: <Search /> },
      { path: '/settings', element: <Settings /> },
      { path: '/login', element: <Login /> },
      { path: '/profile', element: <Profile /> }, // 👈 added
      { path: '*', element: <NotFound /> },
    ],
    []
  );

  /* BACKGROUND */
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

  if (loadingAuth) return null;

  return (
    <>
      <Routing pages={pages} />
      {popunderEnabled && !adKeyPassed ? <Popunder /> : null}
      <style>{backgroundStyle}</style>
    </>
  );
});

ThemedApp.displayName = 'ThemedApp';

/* ================= APP WRAPPER ================= */
const App = () => {
  useEffect(() => {
    signInAnonymously(auth);
  }, []);

  return (
    <OptionsProvider>
      <ThemedApp />
    </OptionsProvider>
  );
};

export default App;