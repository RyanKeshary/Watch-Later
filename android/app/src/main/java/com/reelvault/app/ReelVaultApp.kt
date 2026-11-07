package com.reelvault.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.reelvault.app.util.NetworkMonitor

class ReelVaultApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        NetworkMonitor.start(this)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(
                "watchlater_silent_progress",
                "Watch Later Captures",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Visual progress when saving reels"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
            }
            manager.createNotificationChannel(channel)
        }
    }
}

