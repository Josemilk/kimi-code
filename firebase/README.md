# Firebase for INTELIUX OS

1. Create a Firebase project owned by you.
2. Register Android package `com.inteliux.os`.
3. Enable Firebase Authentication providers required by the product.
4. Create a Firestore database.
5. Deploy `firestore.rules` before exposing user data.
6. Place your generated Android `google-services.json` in `apps/inteliux-android/app/`.

Do not commit service-account credentials. Firestore documents are designed around:

- `users/{uid}`
- `users/{uid}/conversations/{conversationId}`
- `users/{uid}/memories/{memoryId}`
- `users/{uid}/projects/{projectId}`
- `users/{uid}/tasks/{taskId}`
- `users/{uid}/experiences/{experienceId}`

The rules deliberately scope all of these paths to the authenticated user's UID.
