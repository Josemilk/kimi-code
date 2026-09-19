import http from "node:http";
import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { WebSocket, WebSocketServer } from "ws";
import { verifyBearerToken } from "./firebase.js";
import { createTask } from "./tasks.js";
import { ensureKimiConfig, getKimiServerToken, kimiBase, startKimiServer } from "./kimi-runtime.js";

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

app.post("/v1/tasks", async (req, res) => {
  try {
    const result = await createTask(res.locals.uid, String(req.body?.objective ?? ""), String(req.body?.projectId ?? "default"));
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "task creation failed" });
  }
});

app.post("/v1/tasks/:taskId/prompt", async (req, res) => {
  const uid = res.locals.uid;
  const snap = await getFirestore().collection("users").doc(uid).collection("tasks").doc(req.params.taskId).get();
  if (!snap.exists) return res.status(404).json({ error: "task not found" });
  const sessionId = String(snap.get("sessionId"));
  const response = await fetch(`${kimiBase()}/api/v1/sessions/${encodeURIComponent(sessionId)}/prompts`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${kimiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: [{ type: "text", text: String(req.body?.text ?? "") }] })
  });
  res.status(response.status).send(await response.text());
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", async (req, socket, head) => {
  if (req.url !== "/v1/kimi/ws") return socket.destroy();
  const protocols = String(req.headers["sec-websocket-protocol"] ?? "").split(",").map(x => x.trim());
  const firebaseProtocol = protocols.find(x => x.startsWith("firebase.bearer."));
  if (!firebaseProtocol) return socket.destroy();
  let uid: string;
  try { uid = (await verifyBearerToken(`Bearer ${firebaseProtocol.slice("firebase.bearer.".length)}`)).uid; }
  catch { return socket.destroy(); }
  const token = await getKimiServerToken();
  wss.handleUpgrade(req, socket, head, client => {
    const upstream = new WebSocket(`${kimiBase().replace("http", "ws")}/api/v1/ws`, [`kimi-code.bearer.${token}`]);
    client.on("message", async data => {
      try {
        const frame = JSON.parse(data.toString());
        if (frame.type === "subscribe") {
          const ids = Array.isArray(frame.payload?.session_ids) ? frame.payload.session_ids : [];
          if (!ids.length || ids.length > 30) return client.close(1008, "invalid subscription");
          const owned = await getFirestore().collection("users").doc(uid).collection("tasks").where("sessionId", "in", ids).get();
          if (owned.size !== ids.length) return client.close(1008, "session not owned by user");
        }
        if (upstream.readyState === WebSocket.OPEN) upstream.send(data);
      } catch { client.close(1008, "invalid frame"); }
    });
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
  kimiToken = await getKimiServerToken();
  server.listen(port, "0.0.0.0", () => console.log(`INTELIUX gateway listening on ${port}`));
})();
