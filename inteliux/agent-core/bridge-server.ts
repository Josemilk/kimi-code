import { createServer } from "node:http";

import { InteliuxOrchestrator } from "./agent";
import { KimiCliAgentRuntime, type KimiCliRuntimeOptions } from "./kimi-cli-runtime";

export interface InteliuxBridgeOptions extends KimiCliRuntimeOptions {
  readonly host?: string;
  readonly port?: number;
  /** Shared secret for local/backend-to-agent calls. Omit only for an isolated local process. */
  readonly authToken?: string;
}

export function createInteliuxBridge(options: InteliuxBridgeOptions) {
  const runtime = new KimiCliAgentRuntime(options);
  const orchestrator = new InteliuxOrchestrator(runtime);

  return createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/v1/tasks") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    if (options.authToken && request.headers.authorization !== `Bearer ${options.authToken}`) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }

    try {
      const body = await readJson(request);
      const objective = typeof body.objective === "string" ? body.objective.trim() : "";
      if (!objective) {
        response.writeHead(400, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "objective_required" }));
        return;
      }

      const task = await orchestrator.run(objective);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(task));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({
        error: "agent_execution_failed",
        message: error instanceof Error ? error.message : String(error),
      }));
    }
  });
}

function readJson(request: import("node:http").IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) reject(new Error("request_too_large"));
    });
    request.on("end", () => {
      try {
        const parsed: unknown = JSON.parse(raw || "{}");
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          reject(new Error("invalid_json_object"));
          return;
        }
        resolve(parsed as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cwd = process.env.INTELIUX_WORKDIR ?? process.cwd();
  const server = createInteliuxBridge({
    cwd,
    executable: process.env.KIMI_EXECUTABLE ?? "kimi",
    model: process.env.KIMI_MODEL,
    autonomous: process.env.INTELIUX_AUTONOMOUS === "true",
    authToken: process.env.INTELIUX_BRIDGE_TOKEN,
    host: process.env.INTELIUX_BRIDGE_HOST ?? "127.0.0.1",
    port: Number(process.env.INTELIUX_BRIDGE_PORT ?? "8787"),
  });

  server.listen({
    host: process.env.INTELIUX_BRIDGE_HOST ?? "127.0.0.1",
    port: Number(process.env.INTELIUX_BRIDGE_PORT ?? "8787"),
  });
}
