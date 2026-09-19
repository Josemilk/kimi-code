# INTELIUX production gateway

## Architecture

Android authenticates with Firebase Authentication and sends its Firebase ID token to this service. The gateway verifies that token with Firebase Admin, creates a task/workspace, persists task ownership in Firestore, and drives the local `kimi web` server. The Kimi provider API key is never stored in the Android app or Firestore.

Kimi Code CLI's current server API is authenticated by its own bearer token and exposes REST plus WebSocket event streaming. Kimi documents that server API as experimental; production deployments should pin and test the exact Kimi CLI version used by the container and validate against that version's live OpenAPI/AsyncAPI specifications.

## Kimi provider configuration

Choose the endpoint that matches the source of your API key. Do not mix a Kimi Code key with an unrelated Moonshot endpoint.

- Kimi/Moonshot Open Platform API key: `https://api.moonshot.ai/v1` (the current CLI `kimi` provider default).
- Kimi Code API: use the Base URL shown by Kimi for your region/account, such as `https://api.kimi.ai/coding/v1` for overseas OpenAI-compatible access or `https://api.kimi.com/coding/v1` for China.

Current Kimi Code documentation lists model IDs including `k3`, `k3-256k`, `kimi-for-coding`, and `kimi-for-coding-highspeed`; availability depends on the account/plan. Configure the exact model ID your key can call.

## Cloud Run prerequisites

1. Firebase project: `inteliux-os`.
2. Enable Cloud Run, Artifact Registry and Secret Manager APIs.
3. Create a Secret Manager secret named `inteliux-kimi-api-key` containing the Kimi/Moonshot API key.
4. Create a dedicated Cloud Run service account and grant it:
   - Secret Manager Secret Accessor on `inteliux-kimi-api-key`.
   - Cloud Datastore User (or the least-privilege Firestore role required by the project).
5. Deploy the container with the service account attached. Firebase Admin uses Application Default Credentials in Cloud Run, so a service-account JSON file is not required.

## Runtime configuration

Required:

- `KIMI_API_KEY` — injected from Secret Manager.
- `KIMI_MODEL` — exact model identifier enabled for the Kimi account.

Optional:

- `KIMI_BASE_URL` — set this to the endpoint matching the key; default is `https://api.moonshot.ai/v1`.
- `KIMI_MAX_CONTEXT_SIZE` — set to the actual model/account context limit; do not assume 128K if your model supports another limit.
- `INTELIUX_WORKSPACE_ROOT=/tmp/inteliux-workspaces`.

The container generates a mode-0600 Kimi `config.toml` at runtime. The secret is not committed to Git.

## Example deployment

```bash
PROJECT_ID=inteliux-os
REGION=us-central1
SERVICE=inteliux-gateway
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/inteliux/$SERVICE:latest"

gcloud artifacts repositories create inteliux \
  --repository-format=docker --location="$REGION" --project="$PROJECT_ID"

gcloud builds submit --tag "$IMAGE" .

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --service-account "INTELIUX_RUNTIME_SERVICE_ACCOUNT" \
  --set-secrets "KIMI_API_KEY=inteliux-kimi-api-key:latest" \
  --set-env-vars "KIMI_MODEL=YOUR_MODEL,KIMI_BASE_URL=https://api.kimi.ai/coding/v1" \
  --allow-unauthenticated
```

`--allow-unauthenticated` here means Cloud Run's IAM layer accepts the request; INTELIUX still requires a valid Firebase ID token for every `/v1/*` endpoint. Do not expose Kimi's internal server port directly.

## Android endpoint

After deployment, copy the Cloud Run HTTPS service URL and rebuild the APK with:

```bash
./gradlew assembleDebug -PINTELIUX_BACKEND_URL=https://YOUR-SERVICE.run.app
```

GitHub Actions can be given the same value through a repository variable named `INTELIUX_BACKEND_URL`; the Android Gradle build is already designed to accept that property.

## Admin/API-key rotation

The Kimi API key should be created and rotated in Secret Manager. Do not create an endpoint that writes a raw Kimi key into Firestore. If an INTELIUX admin UI is added later, it should invoke a tightly scoped backend secret-rotation operation authenticated with an admin custom claim and protected by App Check/rate limits.

## Workspace durability

The current Cloud Run implementation uses a per-container filesystem under `/tmp`. Firestore task metadata is durable, but files in an interrupted/replaced container are not. Before offering resumable multi-hour coding jobs as a production SLA, add durable workspace storage (for example a controlled object-store sync or a dedicated persistent worker/VM). Do not treat `/tmp` as durable storage.
