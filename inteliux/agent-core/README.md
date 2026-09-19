# INTELIUX ↔ Kimi Agent Core bridge

INTELIUX does not reimplement the Kimi coding engine. The bridge delegates heavy work to the existing Kimi Code runtime.

## Runtime path

`INTELIUX Android → INTELIUX backend/bridge → kimi -p → existing Kimi Agent Core → Kimi model/provider + tools/Skills/MCP/subagents`

The Kimi Code CLI explicitly supports `-p/--prompt` for a non-interactive invocation. The bridge uses that supported headless entry point instead of importing private implementation details from the agent loop.

## Why this boundary

The Android APK should not embed Node.js, the full Kimi runtime, or production provider secrets. A backend/runner keeps the heavy runtime server-side and lets the Android app remain a thin client.

## Execution lifecycle

`plan → execute → verify → repair/replan`

The bridge invokes Kimi for each lifecycle phase. Heavy execution is performed by the existing Kimi Code runtime, so its filesystem, process, terminal, web, Skills, MCP and subagent capabilities remain available according to the workspace and configured policies.

## Security requirements

- Bind the bridge to `127.0.0.1` by default for local use.
- Require `INTELIUX_BRIDGE_TOKEN` when the bridge is exposed to another process/network.
- Do not expose the bridge directly to the public Internet.
- Run the bridge in a dedicated least-privilege workspace/service account.
- Keep Kimi credentials outside source control and outside the APK.
- Treat web/document content as untrusted input.
- Keep destructive operations behind the existing Kimi permission policy and INTELIUX policy gate.
