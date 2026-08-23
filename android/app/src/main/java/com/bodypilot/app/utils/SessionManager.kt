package com.bodypilot.app.utils

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)

    fun saveAuthToken(token: String) {
        prefs.edit().putString(Constants.KEY_JWT_TOKEN, token).apply()
    }

    fun getAuthToken(): String? {
        return prefs.getString(Constants.KEY_JWT_TOKEN, null)
    }

    fun saveUser(id: String, name: String, email: String, role: String, assessmentDone: Boolean) {
        prefs.edit()
            .putString(Constants.KEY_USER_ID, id)
            .putString(Constants.KEY_USER_NAME, name)
            .putString(Constants.KEY_USER_EMAIL, email)
            .putString(Constants.KEY_USER_ROLE, role)
            .putBoolean(Constants.KEY_ASSESSMENT_DONE, assessmentDone)
            .putBoolean(Constants.KEY_ONBOARDING_DONE, assessmentDone)
            .apply()
    }

    fun getUserName(): String = prefs.getString(Constants.KEY_USER_NAME, "Fitness Enthusiast") ?: "Fitness Enthusiast"
    fun getUserEmail(): String = prefs.getString(Constants.KEY_USER_EMAIL, "") ?: ""
    fun getUserRole(): String = prefs.getString(Constants.KEY_USER_ROLE, "user") ?: "user"
    fun isAssessmentCompleted(): Boolean = prefs.getBoolean(Constants.KEY_ASSESSMENT_DONE, false)
    fun setAssessmentCompleted(done: Boolean) {
        prefs.edit().putBoolean(Constants.KEY_ASSESSMENT_DONE, done).apply()
    }

    fun isLoggedIn(): Boolean {
        return !getAuthToken().isNullOrEmpty()
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
