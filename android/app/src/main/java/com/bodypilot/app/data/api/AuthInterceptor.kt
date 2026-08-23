package com.bodypilot.app.data.api

import com.bodypilot.app.BodyPilotApp
import com.bodypilot.app.utils.SessionManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val sessionManager = SessionManager(BodyPilotApp.instance)
        val token = sessionManager.getAuthToken()

        val requestBuilder = chain.request().newBuilder()
        if (!token.isNullOrEmpty()) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }

        return chain.proceed(requestBuilder.build())
    }
}
