package com.inteliux.os.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inteliux.os.auth.FirebaseAuthRepository
import com.inteliux.os.network.TaskGatewayClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class InteliuxViewModel(
    private val auth: FirebaseAuthRepository = FirebaseAuthRepository(),
    private val gateway: TaskGatewayClient = TaskGatewayClient()
) : ViewModel() {
    private val _message = MutableStateFlow("")
    val message: StateFlow<String> = _message.asStateFlow()

    fun signIn(email: String, password: String) = viewModelScope.launch(Dispatchers.IO) {
        runCatching { auth.signIn(email, password) }
            .onSuccess { _message.value = "Sesión iniciada" }
            .onFailure { _message.value = it.message ?: "No se pudo iniciar sesión" }
    }

    fun register(email: String, password: String) = viewModelScope.launch(Dispatchers.IO) {
        runCatching { auth.register(email, password) }
            .onSuccess { _message.value = "Cuenta creada" }
            .onFailure { _message.value = it.message ?: "No se pudo crear la cuenta" }
    }

    fun submitTask(objective: String) = viewModelScope.launch(Dispatchers.IO) {
        val token = auth.idToken() ?: run { _message.value = "Inicia sesión primero"; return@launch }
        runCatching { gateway.createTask(token, objective) }
            .onSuccess { _message.value = "Tarea enviada: $it" }
            .onFailure { _message.value = it.message ?: "No se pudo enviar la tarea" }
    }
}
