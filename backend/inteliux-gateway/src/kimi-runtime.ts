import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const home = process.env.KIMI_CODE_HOME ?? "/tmp/inteliux-kimi";
const port = Number(process.env.KIMI_PORT ?? 8081);

export async function ensureKimiConfig() {
  const key = process.env.KIMI_API_KEY;
  if (!key) throw new Error("KIMI_API_KEY is not configured");
  const baseUrl = process.env.KIMI_BASE_URL ?? "https://api.moonshot.ai/v1";
  const model = process.env.KIMI_MODEL;
  if (!model) throw new Error("KIMI_MODEL is not configured");
  await mkdir(home, { recursive: true, mode: 0o700 });
  const config = [
    "[providers.kimi]",
    'type = "kimi"',
    `base_url = ${JSON.stringify(baseUrl)}`,
    `api_key = ${JSON.stringify(key)}`,
    "",
    `[models.${JSON.stringify(model)}]`,
    'provider = "kimi"',
    `model = ${JSON.stringify(model)}`,
    "max_context_size = 128000",
    "capabilities = [\"thinking\", \"tool_use\"]",
    "",
    `default_model = ${JSON.stringify(model)}`,
    ""
  ].join("\n");
  await writeFile(`${home}/config.toml`, config, { mode: 0o600 });
}

export function startKimiServer() {
  const child = spawn("kimi", ["web", "--host", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, KIMI_CODE_HOME: home },
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout?.on("data", (d) => process.stdout.write(`[kimi] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[kimi] ${d}`));
  child.on("exit", (code, signal) => console.error(`Kimi server exited code=${code} signal=${signal}`));
  return child;
}

export const kimiBase = () => `http://127.0.0.1:${port}`;
