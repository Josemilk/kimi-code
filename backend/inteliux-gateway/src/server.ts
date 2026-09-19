import http from "node:http";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { WebSocket, WebSocketServer } from "ws";
import { verifyBearerToken } from "./firebase.js";
import { ensureKimiConfig, kimiBase, readKimiServerToken, startKimiServer } from "./kimi-runtime.js";

const app = express();
app.use(express.json({ limit: "256kb" }));
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "inteliux-gateway" }));

let kimiToken = process.env.KIMI_SERVER_TOKEN ?? "";
app.use("/v1", async (req, res, next) => {
  try {
    const decoded = await verifyBearerToken(req.headers.authorization);
    res.locals.uid = decoded.uid;
    next();
  } catch { res.status(401).json({ error: "unauthorized" }); }
});

app.use("/v1/kimi", createProxyMiddleware({
  target: kimiBase(),
  changeOrigin: false,
  pathRewrite: { "^/v1/kimi": "/api/v1" },
  on: { proxyReq(proxyReq) { proxyReq.setHeader("Authorization", `Bearer ${kimiToken}`); } }
}));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", async (req, socket, head) => {
  if (req.url !== "/v1/kimi/ws") return socket.destroy();
  const protocols = String(req.headers["sec-websocket-protocol"] ?? "").split(",").map(x => x.trim());
  const firebaseProtocol = protocols.find(x => x.startsWith("firebase.bearer."));
  if (!firebaseProtocol) return socket.destroy();
  try { await verifyBearerToken(`Bearer ${firebaseProtocol.slice("firebase.bearer.".length)}`); }
  catch { return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, client => {
    const upstream = new WebSocket(`${kimiBase().replace("http", "ws")}/api/v1/ws`, [`kimi-code.bearer.${kimiToken}`]);
    upstream.on("open", () => client.on("message", data => upstream.send(data)));
    upstream.on("message", data => { if (client.readyState === WebSocket.OPEN) client.send(data); });
    upstream.on("close", () => client.close());
    client.on("close", () => upstream.close());
    upstream.on("error", () => client.close());
  });
});

const port = Number(process.env.PORT ?? 8080);
(async () => {
  await ensureKimiConfig();
  startKimiServer();
  if (!kimiToken) kimiToken = await readKimiServerToken();
  server.listen(port, "0.0.0.0", () => console.log(`INTELIUX gateway listening on ${port}`));
})();
