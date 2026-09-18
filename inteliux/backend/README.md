# INTELIUX backend boundary

The Android application must never contain the Kimi API secret.

Production flow:

Android -> Firebase Authentication -> backend -> Kimi Agent Runtime -> Kimi API

The backend should verify the Firebase ID token, derive the authenticated UID, authorize the requested project/workspace, and inject `KIMI_API_KEY` from the deployment secret manager/environment.

Do not store the Kimi key in Firestore, Android resources, Gradle properties committed to Git, or GitHub source files.
