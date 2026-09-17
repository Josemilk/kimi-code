# INTELIUX Task Gateway

The Task Gateway is the transport/session boundary between INTELIUX and the existing Kimi Agent Core.

## Lifecycle

`POST /v1/tasks` creates a durable-in-process task session and immediately starts the Kimi runtime in the requested workspace.

`GET /v1/tasks/:id` returns the current state and accumulated events.

`POST /v1/tasks/:id/cancel` requests cancellation.

## Workspace

Every task carries an explicit `workspace`. The Kimi CLI process uses that path as its working directory, preserving the existing Kimi filesystem/tool/Skills/MCP behavior available to that runtime.

## Events

The session records queued, started, progress, tool, confirmation, completed and failed events. The current adapter maps Kimi stdout/stderr to progress events; structured tool events can be added when the Agent Core event stream is exposed by the runtime.

## Production requirements

- Persist sessions/events in Firestore or a dedicated job store.
- Replace the in-memory session map with durable storage.
- Authenticate requests with Firebase ID tokens at the backend edge.
- Authorize workspace ownership before execution.
- Add quotas, cancellation propagation and process isolation.
- Prefer a structured Agent Core event API over parsing terminal output.
- Never accept arbitrary filesystem paths from an untrusted client.
- Keep Kimi credentials in the backend secret manager, not the APK.
