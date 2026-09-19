# INTELIUX production gateway

## Architecture

Android authenticates with Firebase Authentication and sends its Firebase ID token to this service. The gateway verifies that token with Firebase Admin, creates a task/workspace, persists task ownership in Firestore, and drives the local `kimi web` server. The Kimi provider API key is never stored in the Android app or Firestore.

Kimi Code CLI's current server API is authenticated by its own bearer token and exposes REST plus WebSocket event streaming. The server API is documented by Kimi as experimental; production deployments should pin and test the exact Kimi CLI version used by the container.

## Cloud Run prerequisites

1. Firebase project: `inteliux-os`.
2. Enable Cloud Run, Artifact Registry and Secret Manager APIs.
3. Create a Secret Manager secret named `inteliux-kimi-api-key` containing the Moonshot/Kimi API key.
4. Create a dedicated Cloud Run service account and grant it:
   - Secret Manager Secret Accessor on `inteliux-kimi-api-key`.
   - Cloud Datastore User (or the least-privilege Firestore role required by the project).
5. Deploy the container with the service account attached. Firebase Admin uses Application Default Credentials in Cloud Run, so a service-account JSON file is not required.

## Runtime configuration

Required:

- `KIMI_API_KEY` — injected from Secret Manager.
- `KIMI_MODEL` — the exact model identifier enabled for the Kimi/Moonshot account.

Optional:

- `KIMI_BASE_URL=https://api.moonshot.ai/v1`
- `KIMI_MAX_CONTEXT_SIZE=128000` (set this to the actual model context size when known)
- `INTELIUX_WORKSPACE_ROOT=/tmp/inteliux-workspaces`

The container generates a mode-0600 Kimi `config.toml` at runtime. The secret is not committed to Git.

## Example deployment

```bash
# build and deploy from backend/inteliux-gateway
PROJECT_ID=inteliux-os
REGION=us-central1
SERVICE=inteliux-gateway
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/inteliux/$SERVICE:latest"

# Create Artifact Registry repository once if needed.
gcloud artifacts repositories create inteliux \
  --repository-format=docker --location="$REGION" --project="$PROJECT_ID"

gcloud builds submit --tag "$IMAGE" .

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --service-account "INTELIUX_RUNTIME_SERVICE_ACCOUNT" \
  --set-secrets "KIMI_API_KEY=inteliux-kimi-api-key:latest" \
  --set-env-vars "KIMI_MODEL=YOUR_MODEL,KIMI_BASE_URL=https://api.moonshot.ai/v1" \
  --allow-unauthenticated
```

`--allow-unauthenticated` here means Cloud Run's IAM layer accepts the request; INTELIUX still requires a valid Firebase ID token for every `/v1/*` endpoint. Do not expose Kimi's internal server port directly.

## Admin/API-key rotation

The Kimi API key should be created and rotated in Secret Manager. Do not create an endpoint that writes a raw Kimi key into Firestore. If an INTELIUX admin UI is added later, it should invoke a tightly scoped backend secret-rotation operation authenticated with an admin custom claim and protected by App Check/rate limits.

## Workspace durability

The current Cloud Run implementation uses a per-container filesystem under `/tmp`. Firestore task metadata is durable, but files in an interrupted/replaced container are not. Before offering resumable multi-hour coding jobs as a production SLA, add durable workspace storage (for example a controlled object-store sync or a dedicated persistent worker/VM). Do not treat `/tmp` as durable storage.

## Kimi API/server compatibility

Pin the Kimi Code CLI version in the container once the target release is selected. Kimi documents the `kimi web` REST/WebSocket API as experimental and recommends relying on the live OpenAPI/AsyncAPI specification of the exact running version. Test session creation, prompts, approvals, tools, MCP and WebSocket event streaming after every CLI upgrade.
