# INTELIUX Task Gateway

The Task Gateway is the transport/session boundary between INTELIUX and the existing Kimi Agent Core.

## Endpoints

- `POST /v1/tasks` creates a task session.
- `GET /v1/tasks/:id` returns the current state and accumulated events.
- `GET /v1/tasks/:id/events` provides live Server-Sent Events (SSE).
- `POST /v1/tasks/:id/cancel` requests cancellation.

## Workspace

Every task carries an explicit workspace. The Kimi CLI process uses that path as its working directory, preserving the existing Kimi filesystem/tool/Skills/MCP behavior available to that runtime.

## Production requirements

- Persist sessions/events in Firestore or a dedicated job store.
- Validate Firebase ID tokens at the backend edge.
- Authorize workspace ownership before execution.
- Add quotas and process isolation.
- Replace terminal-output parsing with structured Agent Core events when exposed by the runtime.
- Never accept arbitrary filesystem paths from an untrusted client.
- Keep Kimi credentials in a server-side secret manager, never in the APK.
