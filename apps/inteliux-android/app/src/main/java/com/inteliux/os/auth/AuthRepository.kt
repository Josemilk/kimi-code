package com.inteliux.os.auth

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

class AuthRepository(private val auth: FirebaseAuth = FirebaseAuth.getInstance()) {
    suspend fun register(email: String, password: String) =
        auth.createUserWithEmailAndPassword(email, password).await()

    suspend fun login(email: String, password: String) =
        auth.signInWithEmailAndPassword(email, password).await()

    suspend fun resetPassword(email: String) =
        auth.sendPasswordResetEmail(email).await()

    fun logout() = auth.signOut()
    fun uid(): String? = auth.currentUser?.uid
}
