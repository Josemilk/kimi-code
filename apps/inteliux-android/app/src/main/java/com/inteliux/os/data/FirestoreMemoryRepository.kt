package com.inteliux.os.data

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class FirestoreMemoryRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun save(uid: String, text: String, importance: Double = 0.5) {
        require(uid.isNotBlank())
        require(text.isNotBlank())
        firestore.collection("users").document(uid).collection("memories")
            .add(mapOf(
                "text" to text.trim(),
                "importance" to importance.coerceIn(0.0, 1.0),
                "createdAt" to com.google.firebase.firestore.FieldValue.serverTimestamp()
            )).await()
    }
}
