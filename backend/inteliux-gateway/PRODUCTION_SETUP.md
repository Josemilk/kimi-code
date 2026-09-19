# INTELIUX production checklist

1. Use the Google Cloud project linked to Firebase.
2. Enable Cloud Run, Artifact Registry, Secret Manager, Cloud Storage and IAM.
3. Create a private Cloud Storage bucket dedicated to INTELIUX workspaces. Put its name in GitHub variable `INTELIUX_STORAGE_BUCKET`.
4. Create Secret Manager secret `inteliux-kimi-api-key` and store the Kimi API key there. Do not commit the key.
5. Create a dedicated Cloud Run runtime service account. Grant it `roles/secretmanager.secretAccessor` on the Kimi secret and `roles/storage.objectAdmin` on the INTELIUX bucket.
6. Configure GitHub Actions Workload Identity Federation. Set repository variables `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, `INTELIUX_RUNTIME_SERVICE_ACCOUNT`, and `INTELIUX_STORAGE_BUCKET`.
7. Optionally set `KIMI_BASE_URL` and `KIMI_MODEL` as repository variables.
8. Run the `INTELIUX OS Production` workflow. Pull requests validate but do not deploy. Pushes to `inteliux-os` build the APK, upload the APK artifact, build the gateway image, and deploy Cloud Run when the required variables exist.

Cloud Run is intentionally public at the HTTP ingress layer because the Android client authenticates requests with Firebase ID tokens rather than Cloud Run IAM tokens. The application gateway is the authentication boundary and rejects every `/v1` request without a valid Firebase token. `/healthz` is intentionally public for service health checks.

Workspace files are restored from and snapshotted to Cloud Storage. Firestore remains the metadata source of truth. Cloud Run's local filesystem is treated as ephemeral.
