package com.inteliux.os.network

import com.inteliux.os.BuildConfig
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class TaskGatewayClient {
    private val baseUrl = BuildConfig.INTELIUX_BACKEND_URL.trimEnd('/')

    fun createTask(idToken: String, objective: String, projectId: String = "default"): String {
        require(baseUrl.startsWith("https://")) { "INTELIUX backend URL must use HTTPS" }
        val connection = (URL("$baseUrl/v1/tasks").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 60_000
            doOutput = true
            setRequestProperty("Authorization", "Bearer $idToken")
            setRequestProperty("Content-Type", "application/json")
        }
        connection.outputStream.use {
            it.write(JSONObject().apply {
                put("objective", objective)
                put("projectId", projectId)
            }.toString().toByteArray())
        }
        val body = (if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream)
            ?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (connection.responseCode !in 200..299) throw IllegalStateException("Gateway ${connection.responseCode}: $body")
        return JSONObject(body).getString("taskId")
    }
}
