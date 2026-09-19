package com.inteliux.os

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.inteliux.os.ui.InteliuxViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { InteliuxHome(InteliuxViewModel()) }
    }
}

@Composable
private fun InteliuxHome(viewModel: InteliuxViewModel) {
    val message by viewModel.message.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var task by remember { mutableStateOf("") }

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("INTELIUX OS", style = MaterialTheme.typography.headlineLarge)
                Text("Agente personal autónomo")
                OutlinedTextField(email, { email = it }, Modifier.fillMaxWidth(), label = { Text("Correo") })
                OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("Contraseña") })
                Button(onClick = { viewModel.signIn(email, password) }, Modifier.fillMaxWidth()) { Text("Iniciar sesión") }
                Button(onClick = { viewModel.register(email, password) }, Modifier.fillMaxWidth()) { Text("Crear cuenta") }
                OutlinedTextField(task, { task = it }, Modifier.fillMaxWidth(), label = { Text("Tarea para INTELIUX") })
                Button(onClick = { viewModel.submitTask(task) }, Modifier.fillMaxWidth()) { Text("Ejecutar tarea") }
                if (message.isNotBlank()) Text(message)
            }
        }
    }
}
