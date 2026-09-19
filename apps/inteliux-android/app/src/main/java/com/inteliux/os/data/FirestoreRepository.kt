package com.inteliux.os.data

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class FirestoreRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {
    suspend fun putUserProfile(uid: String, data: Map<String, Any?>) {
        db.collection("users").document(uid).set(data).await()
    }

    suspend fun putMemory(uid: String, memoryId: String, data: Map<String, Any?>) {
        db.collection("users").document(uid)
            .collection("memories").document(memoryId).set(data).await()
    }

    suspend fun putTask(uid: String, taskId: String, data: Map<String, Any?>) {
        db.collection("users").document(uid)
            .collection("tasks").document(taskId).set(data).await()
    }
}
