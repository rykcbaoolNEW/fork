import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import compress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import fs from "node:fs";
import psl from "psl";

import { logging, server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createBareServer } from "@tomphttp/bare-server-node";
import { MasqrMiddleware } from "./masqr.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 1234;
const host = process.env.HOST || "0.0.0.0";

const server = createServer();
const bare = process.env.BARE !== "false" ? createBareServer("/seal/") : null;

logging.set_level(logging.NONE);

Object.assign(wisp.options, {
  dns_method: "resolve",
  dns_servers: ["1.1.1.3", "1.0.0.3"],
  dns_result_order: "ipv4first"
});

let BLOCKED = [];

try {
  BLOCKED = JSON.parse(
    fs.readFileSync(join(__dirname, "blocked.json"), "utf-8")
  );

  if (!Array.isArray(BLOCKED)) {
    console.log("blocked.json must be an array");
    BLOCKED = [];
  }
} catch {
  console.log("blocked.json not found or invalid");
}

function isAllowedDomain(domain) {
  domain = (domain || "").toLowerCase();

  return !BLOCKED.some((blocked) => {
    blocked = blocked.toLowerCase();
    return domain === blocked || domain.endsWith("." + blocked);
  });
}

function checkUrlAllowed(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const parsed = psl.parse(u.hostname);

    if (parsed.error || !parsed.domain) return false;
    return isAllowedDomain(u.hostname);
  } catch {
    return false;
  }
}

server.on("upgrade", (req, sock, head) => {
  const url = req.url || "";

  // Try blocking websocket/bare/wisp targets
  if (!isAllowedDomain(req.headers.host || "")) {
    sock.destroy();
    return;
  }

  if (bare?.shouldRoute(req)) {
    return bare.routeUpgrade(req, sock, head);
  }

  if (url.endsWith("/wisp/")) {
    return wisp.routeRequest(req, sock, head);
  }

  sock.end();
});


const app = Fastify({
  serverFactory: (h) => (
    server.on("request", (req, res) => {
      if (bare?.shouldRoute(req)) return bare.routeRequest(req, res);
      h(req, res);
    }),
    server
  ),
  logger: false,
  keepAliveTimeout: 30000,
  connectionTimeout: 60000,
  forceCloseConnections: true
});

await app.register(fastifyCookie);
await app.register(compress, {
  global: true,
  encodings: ["gzip", "deflate", "br"]
});

app.register(fastifyStatic, {
  root: join(__dirname, "dist"),
  prefix: "/",
  decorateReply: true,
  etag: true,
  lastModified: true,
  cacheControl: true,
  setHeaders(res, path) {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    } else if (/\.[a-f0-9]{8,}\./.test(path)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  }
});

if (process.env.MASQR === "true") {
  app.addHook("onRequest", MasqrMiddleware);
}



app.get("/tls-check", async (req, reply) => {
  const ip = req.ip === "::1" ? "127.0.0.1" : req.ip;

  if (ip !== "127.0.0.1") return reply.code(403).send();

  const domain = (req.query?.domain || "").toLowerCase();
  if (!domain) return reply.code(403).send();

  const parsed = psl.parse(domain);
  if (parsed.error || !parsed.domain) return reply.code(403).send();

  if (!isAllowedDomain(domain)) {
    console.log("BLOCKED TLS:", domain);
    return reply.code(403).send();
  }

  console.log("ALLOWED TLS:", domain);
  return reply.code(200).send();
});



const proxy =
  (url, type = "application/javascript") =>
  async (req, reply) => {
    try {
      const target = new URL(url(req));

      // 🔥 REAL BLOCKING HERE
      if (!isAllowedDomain(target.hostname)) {
        console.log("BLOCKED PROXY:", target.hostname);
        return reply.code(403).send("Blocked domain");
      }

      const res = await fetch(target);

      if (!res.ok) return reply.code(res.status).send();

      const hop = [
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "content-encoding"
      ];

      for (const [k, v] of res.headers) {
        if (!hop.includes(k.toLowerCase())) reply.header(k, v);
      }

      const cookies = res.headers.getSetCookie?.();
      if (cookies?.length) reply.header("set-cookie", cookies);

      if (!res.headers.get("content-type")) reply.type(type);

      return reply.send(res.body);
    } catch {
      return reply.code(500).send();
    }
  };



app.get(
  "/assets/img/*",
  proxy((req) => `https://dogeub-assets.pages.dev/img/${req.params["*"]}`, "")
);

app.get(
  "/assets-fb/*",
  proxy((req) => `https://dogeub-assets.pages.dev/img/server/${req.params["*"]}`, "")
);

app.get("/js/script.js", proxy(() => "https://byod.privatedns.org/js/script.js"));

app.get("/ds", (req, res) =>
  res.redirect("https://discord.gg/ZBef7HnAeg")
);

app.get("/return", async (req, reply) =>
  req.query?.q
    ? fetch(
        `https://duckduckgo.com/ac/?q=${encodeURIComponent(req.query.q)}`
      )
        .then((r) => r.json())
        .catch(() => reply.code(500).send({ error: "request failed" }))
    : reply.code(401).send({ error: "query parameter?" })
);

app.setNotFoundHandler((req, reply) =>
  req.raw.method === "GET" && req.headers.accept?.includes("text/html")
    ? reply.sendFile("index.html")
    : reply.code(404).send({ error: "Not Found" })
);


app.listen({ port, host }).then(() => {
  console.log(`Server running on http://${host}:${port}`);
});
