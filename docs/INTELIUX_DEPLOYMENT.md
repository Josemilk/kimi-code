# INTELIUX deployment model

## 1. Android application

Build `apps/inteliux-android` with the `INTELIUX OS Android` GitHub Actions workflow. The debug APK is published as a workflow artifact. A later release workflow can sign a release APK/AAB.

## 2. Firebase

Use Firebase Authentication + Cloud Firestore for identity and application data:

- users
- conversations
- memories
- preferences
- projects
- tasks
- task history

Firestore is the persistent application database. It is not the Kimi model runtime.

## 3. Kimi for complex work

Keep the existing Kimi Code engine/provider path for heavy coding and multi-step programming tasks. INTELIUX should route those jobs through a provider adapter rather than reimplementing the model server.

Changing the app name, Android package, UI, local database, Firestore schema, memory layer, or orchestration layer does not inherently break provider communication. It only changes if we alter the provider protocol, endpoint, authentication flow, model configuration, or access terms.

## 4. Secure INTELIUX backend

For production, use a small backend (Firebase Cloud Functions or Cloud Run) for operations that must not expose provider secrets in the APK. The backend can:

1. authenticate the Firebase user;
2. load allowed memory/task context;
3. classify the task;
4. route lightweight application operations locally/Firebase-side;
5. route complex coding jobs to the Kimi provider;
6. stream progress/results back to the Android app;
7. persist task metadata in Firestore.

Do not store a Kimi API secret in Firestore or hard-code a production provider secret in the APK.

## 5. Data split

Firebase/Firestore:
`identity + memory + preferences + task metadata + application state`

Kimi:
`model inference + coding-agent reasoning + complex coding execution through the existing Kimi agent/tool architecture`

INTELIUX backend:
`secure routing + authorization + long-running jobs + provider credentials + audit metadata`

## 6. Important limitation

Firebase cannot replace Kimi's model infrastructure. If a task needs the Kimi coding agent's tools, sandbox, Skills, MCP, or subagents, it must be executed through the Kimi/INTELIUX agent runtime rather than only through Firestore.
