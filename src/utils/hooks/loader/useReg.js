import { useEffect } from 'react';
import { BareMuxConnection } from 'bare-mux-fork';
import { useOptions } from '/src/utils/optionsContext';
import { makecodec } from './of';

export default function useReg() {
  const { options } = useOptions();

  const defaultWs =
    `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}/wisp/`;

  const sws = [
    {
      path: new URL('/sw.js', location.origin).href,
      scope: new URL('/portal/k12/', location.origin).href,
    },
    {
      path: new URL('/s_sw.js', location.origin).href,
      scope: new URL('/ham/', location.origin).href,
    },
  ];

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // ---------------------------
        // 1. Load Scramjet script
        // ---------------------------
        if (!window.scr) {
          const script = document.createElement('script');
          script.src = '/eggs/scramjet.all.js';

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = (err) => {
              console.error('[Scramjet] Failed to load script');
              reject(err);
            };
            document.head.appendChild(script);
          });

          if (cancelled) return;
        }

        // ---------------------------
        // 2. Validate Scramjet loader
        // ---------------------------
        if (typeof window.$scramjetLoadController !== 'function') {
          console.error('[Scramjet] Loader missing: $scramjetLoadController');
          return;
        }

        const mod = window.$scramjetLoadController();
        const ScramjetController = mod?.ScramjetController;

        if (!ScramjetController) {
          console.error('[Scramjet] ScramjetController not found');
          return;
        }

        // ---------------------------
        // 3. Init Scramjet
        // ---------------------------
        window.scr = new ScramjetController({
          prefix: '/ham/',
          files: {
            wasm: '/eggs/scramjet.wasm.wasm',
            all: '/eggs/scramjet.all.js',
            sync: '/eggs/scramjet.sync.js',
          },
          flags: {
            rewriterLogs: false,
            scramitize: false,
            cleanErrors: true,
            sourcemaps: true,
          },
          codec: makecodec(),
        });

        window.scr.init();

        // ---------------------------
        // 4. Register service workers
        // ---------------------------
        for (const sw of sws) {
          try {
            await navigator.serviceWorker.register(sw.path, {
              scope: sw.scope,
            });
          } catch (err) {
            console.warn('[SW] Registration failed:', err);
          }
        }

        // ---------------------------
        // 5. BareMux setup
        // ---------------------------
        if (!window.BareMuxConnection && !BareMuxConnection) {
          console.error('[BareMux] Connection class missing');
          return;
        }

        const connection = new BareMuxConnection(
          new URL('/baremux/worker.js', location.origin).href
        );

        await connection.setTransport('/libcurl/index.mjs', [
          { wisp: options.wServer || defaultWs },
        ]);
      } catch (err) {
        console.error('[useReg] Init failed:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [options.wServer]);
}
