# Firebase for INTELIUX OS

1. Create a Firebase project owned by you.
2. Register Android package `com.inteliux.os`.
3. Enable Firebase Authentication providers required by the product.
4. Create a Cloud Firestore database in production/locked mode.
5. Deploy `firestore.rules` before exposing user data.
6. Place your generated Android `google-services.json` in `apps/inteliux-android/app/` for a local build. The file contains project/app identifiers and is not a substitute for server secrets.
7. Enable Firebase App Check before production rollout.

## Data model

- `users/{uid}`
- `users/{uid}/conversations/{conversationId}`
- `users/{uid}/memories/{memoryId}`
- `users/{uid}/projects/{projectId}`
- `users/{uid}/tasks/{taskId}`
- `users/{uid}/experiences/{experienceId}`

The rules scope these paths to the authenticated user's UID. Backend/server SDK access must be protected with IAM and server credentials.

## Kimi credential

Never put the Kimi API key in the Android APK, Firestore documents, Git repository, or client-side configuration. Store it as `KIMI_API_KEY` in the trusted INTELIUX backend/runtime secret environment. The existing Kimi Code configuration supports `api_key_env`/`KIMI_API_KEY` for provider credentials.
