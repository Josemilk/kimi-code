package com.inteliux.os.settings

import android.app.Activity
import android.os.Build
import android.os.LocaleList
import java.util.Locale

object LanguageController {
    fun apply(activity: Activity) {
        val locale = LanguageManager.locale(activity)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.applicationContext.getSystemService(android.app.LocaleManager::class.java)
                ?.applicationLocales = LocaleList.forLanguageTags(locale.toLanguageTag())
        } else {
            @Suppress("DEPRECATION")
            Locale.setDefault(locale)
            @Suppress("DEPRECATION")
            activity.resources.configuration.setLocale(locale)
            @Suppress("DEPRECATION")
            activity.resources.updateConfiguration(activity.resources.configuration, activity.resources.displayMetrics)
        }
    }
}
