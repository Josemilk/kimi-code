package com.inteliux.os.auth

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

class FirebaseAuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    val currentUser get() = auth.currentUser

    suspend fun signIn(email: String, password: String) =
        auth.signInWithEmailAndPassword(email.trim(), password).await().user

    suspend fun register(email: String, password: String) =
        auth.createUserWithEmailAndPassword(email.trim(), password).await().user

    suspend fun resetPassword(email: String) =
        auth.sendPasswordResetEmail(email.trim()).await()

    suspend fun idToken(forceRefresh: Boolean = false): String? =
        auth.currentUser?.getIdToken(forceRefresh)?.await()?.token

    fun signOut() = auth.signOut()
}
