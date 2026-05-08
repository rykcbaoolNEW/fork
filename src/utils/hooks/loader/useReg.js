import { useEffect } from 'react';
import { BareMuxConnection } from 'bare-mux-fork';
import { useOptions } from '/src/utils/optionsContext';
import { makecodec } from './of';

export default function useReg() {
  const { options } = useOptions();
  const defaultWs = `${location.protocol == 'http:' ? 'ws:' : 'wss:'}//${location.host}/wisp/`;
  const sws = [
    { path: new URL('/sw.js', location.origin).href, scope: new URL('/portal/k12/', location.origin).href },
    { path: new URL('/s_sw.js', location.origin).href, scope: new URL('/ham/', location.origin).href }
  ];

 useEffect(() => {
  let cancelled = false;

  const init = async () => {
    if (!window.scr) {
      const script = document.createElement("script");
      script.src = "/eggs/scramjet.all.js";

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      if (cancelled) return;
    }

    if (!window.$scramjetLoadController) return;

    const { ScramjetController } = $scramjetLoadController();

    if (!ScramjetController) return;

    window.scr = new ScramjetController({
      prefix: "/ham/",
      files: {
        wasm: "/eggs/scramjet.wasm.wasm",
        all: "/eggs/scramjet.all.js",
        sync: "/eggs/scramjet.sync.js",
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

    for (const sw of sws) {
      try {
        await navigator.serviceWorker.register(sw.path, {
          scope: sw.scope,
        });
      } catch (err) {
        console.warn("SW error:", err);
      }
    }

    const connection = new BareMuxConnection(
      new URL("/baremux/worker.js", location.origin).href
    );

    await connection.setTransport("/libcurl/index.mjs", [
      { wisp: options.wServer || defaultWs },
    ]);
  };

  init();

  return () => {
    cancelled = true;
  };
}, [options.wServer]);
}
