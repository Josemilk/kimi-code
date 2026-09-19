import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const home = process.env.KIMI_CODE_HOME ?? "/tmp/inteliux-kimi";
const port = Number(process.env.KIMI_PORT ?? 58627);

export async function ensureKimiConfig() {
  const key = process.env.KIMI_API_KEY;
  if (!key) throw new Error("KIMI_API_KEY is not configured");
  const baseUrl = process.env.KIMI_BASE_URL ?? "https://api.moonshot.ai/v1";
  const model = process.env.KIMI_MODEL;
  if (!model) throw new Error("KIMI_MODEL is not configured");
  const contextSize = Number(process.env.KIMI_MAX_CONTEXT_SIZE ?? 128000);
  await mkdir(home, { recursive: true, mode: 0o700 });
  const config = [
    `default_model = ${JSON.stringify(model)}`,
    "",
    "[providers.kimi]",
    'type = "kimi"',
    `base_url = ${JSON.stringify(baseUrl)}`,
    `api_key = ${JSON.stringify(key)}`,
    "",
    `[models.${JSON.stringify(model)}]`,
    'provider = "kimi"',
    `model = ${JSON.stringify(model)}`,
    `max_context_size = ${contextSize}`,
    'capabilities = ["thinking", "tool_use"]',
    ""
  ].join("\n");
  await writeFile(`${home}/config.toml`, config, { mode: 0o600 });
}

export function startKimiServer() {
  return spawn("kimi", ["web", "--no-open", "--host", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, KIMI_CODE_HOME: home },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

export async function readKimiServerToken() {
  for (let i = 0; i < 50; i++) {
    try { return (await readFile(`${home}/server.token`, "utf8")).trim(); }
    catch { await new Promise(r => setTimeout(r, 200)); }
  }
  throw new Error("Kimi web server token was not created in time");
}

export const kimiBase = () => `http://127.0.0.1:${port}`;
