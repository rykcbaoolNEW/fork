import { useEffect } from "react";
import { BareMuxConnection } from "bare-mux-fork";
import { useOptions } from "/src/utils/optionsContext.jsx";
import { makecodec } from "/src/utils/hooks/loader/of.js";

export default function useReg() {
  const { options } = useOptions();

  const defaultWs = `${location.protocol === "http:" ? "ws:" : "wss:"}//${location.host}/wisp/`;

  const wispServer = options?.wServer || defaultWs;

  const sws = [
    {
      path: new URL("/sw.js", location.origin).href,
      scope: new URL("/portal/k12/", location.origin).href,
    },
    {
      path: new URL("/s_sw.js", location.origin).href,
      scope: new URL("/ham/", location.origin).href,
    },
  ];

  useEffect(() => {
    let cancelled = false;
    let scrInitialized = false;

    const init = async () => {
      try {
        // ---------------------------
        // 1. Scramjet script load
        // ---------------------------
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

        // ---------------------------
        // 2. Scramjet loader safety
        // ---------------------------
        const loader = window.$scramjetLoadController;
        if (typeof loader !== "function") {
          console.error("[Scramjet] loader missing");
          return;
        }

        const mod = loader();
        const ScramjetController = mod?.ScramjetController;

        if (!ScramjetController) {
          console.error("[Scramjet] controller missing");
          return;
        }

        // ---------------------------
        // 3. Init Scramjet (prevent double init)
        // ---------------------------
        if (!scrInitialized) {
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
          scrInitialized = true;
        }

        // ---------------------------
        // 4. Service workers
        // ---------------------------
        if ("serviceWorker" in navigator) {
          for (const sw of sws) {
            try {
              await navigator.serviceWorker.register(sw.path, {
                scope: sw.scope,
              });
            } catch (err) {
              console.warn("[SW] failed:", err);
            }
          }
        }

        // ---------------------------
        // 5. BareMux safety init
        // ---------------------------
        if (!BareMuxConnection) {
          console.error("[BareMux] missing class");
          return;
        }

        const workerUrl = new URL("/baremux/worker.js", location.origin).href;

        const connection = new BareMuxConnection(workerUrl);

        if (!connection?.setTransport) {
          console.error("[BareMux] setTransport missing");
          return;
        }

        await connection.setTransport("/libcurl/index.mjs", [
          { wisp: wispServer },
        ]);
      } catch (err) {
        console.error("[useReg] Init failed:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [options?.wServer]);
}
