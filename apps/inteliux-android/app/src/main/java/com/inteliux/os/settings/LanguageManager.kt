package com.inteliux.os.settings

import android.content.Context
import java.util.Locale

object LanguageManager {
    private const val PREFS = "inteliux_settings"
    private const val KEY_LANGUAGE = "language"
    const val SYSTEM = "system"
    const val SPANISH = "es"
    const val ENGLISH = "en"

    fun getLanguage(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_LANGUAGE, SYSTEM) ?: SYSTEM

    fun setLanguage(context: Context, language: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_LANGUAGE, language).apply()
    }

    fun locale(context: Context): Locale {
        return when (getLanguage(context)) {
            SPANISH -> Locale("es")
            ENGLISH -> Locale.ENGLISH
            else -> Locale.getDefault()
        }
    }
}
