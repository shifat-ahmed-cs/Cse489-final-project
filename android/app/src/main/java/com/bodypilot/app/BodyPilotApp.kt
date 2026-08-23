package com.bodypilot.app

import android.app.Application

class BodyPilotApp : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: BodyPilotApp
            private set
    }
}
