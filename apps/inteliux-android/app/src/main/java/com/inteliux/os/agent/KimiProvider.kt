package com.inteliux.os.agent

interface KimiProvider {
    suspend fun complete(system: String, user: String): String
}

/**
 * Keep provider credentials out of UI code. The production implementation can
 * call an INTELIUX backend which holds the Kimi credential server-side.
 */
