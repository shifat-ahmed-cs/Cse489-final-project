package com.bodypilot.app.utils

object Constants {
    // For local emulator: 10.0.2.2 points to host machine localhost
    // For real physical device or local hotspot: change to host LAN IP (e.g. 192.168.x.x)
    const val BASE_URL = "http://10.0.2.2:5000/api/"

    const val PREFS_NAME = "bodypilot_prefs"
    const val KEY_JWT_TOKEN = "jwt_token"
    const val KEY_USER_ID = "user_id"
    const val KEY_USER_NAME = "user_name"
    const val KEY_USER_EMAIL = "user_email"
    const val KEY_USER_ROLE = "user_role"
    const val KEY_ONBOARDING_DONE = "onboarding_done"
    const val KEY_ASSESSMENT_DONE = "assessment_done"
}
