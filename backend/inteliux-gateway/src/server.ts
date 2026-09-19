import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { verifyBearerToken } from "./firebase.js";
import { ensureKimiConfig, kimiBase, startKimiServer } from "./kimi-runtime.js";

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/healthz", (_req, res) => res.json({ ok: true, service: "inteliux-gateway" }));

app.use("/v1", async (req, res, next) => {
  try {
    const decoded = await verifyBearerToken(req.headers.authorization);
    res.locals.uid = decoded.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: "unauthorized" });
  }
});

// Kimi's own REST/WebSocket API remains behind the gateway. The gateway never exposes
// Kimi's bearer token to the Android client.
const kimiToken = process.env.KIMI_SERVER_TOKEN;
if (!kimiToken) console.warn("KIMI_SERVER_TOKEN not set; startup will read the generated token when available");

app.use("/v1/kimi", createProxyMiddleware({
  target: kimiBase(),
  changeOrigin: false,
  pathRewrite: { "^/v1/kimi": "/api/v1" },
  on: {
    proxyReq(proxyReq) {
      if (kimiToken) proxyReq.setHeader("Authorization", `Bearer ${kimiToken}`);
      proxyReq.removeHeader("host");
    }
  }
}));

const port = Number(process.env.PORT ?? 8080);
app.listen(port, "0.0.0.0", async () => {
  await ensureKimiConfig();
  startKimiServer();
  console.log(`INTELIUX gateway listening on ${port}`);
});
