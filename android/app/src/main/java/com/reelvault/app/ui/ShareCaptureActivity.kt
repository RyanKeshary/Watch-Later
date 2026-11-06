package com.reelvault.app.ui

import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.reelvault.app.data.AppDatabase
import com.reelvault.app.data.LocalReel
import com.reelvault.app.sync.ReelSyncWorker
import com.reelvault.app.util.PreferenceManager
import com.reelvault.app.util.UrlHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Invisible translucent activity that silently intercepts Instagram Share intents.
 * Shows silent visual notification and handles sync.
 */
class ShareCaptureActivity : Activity() {

    private val notificationId = 1001
    private val channelId = "reelvault_silent_progress"

    private fun getNotificationManager(): NotificationManager {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = manager.getNotificationChannel(channelId)
            if (existing == null) {
                val channel = NotificationChannel(
                    channelId,
                    "ReelVault Captures",
                    NotificationManager.IMPORTANCE_LOW // Silent with no sound or vibration
                ).apply {
                    description = "Visual progress when saving reels"
                    setSound(null, null)
                    enableVibration(false)
                    setShowBadge(false)
                }
                manager.createNotificationChannel(channel)
            }
        }
        return manager
    }

    private fun showProgressNotification(message: String, progress: Int, indeterminate: Boolean = false) {
        val manager = getNotificationManager()
        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setContentTitle("ReelVault")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSound(null)
            .setVibrate(null)
            .setOnlyAlertOnce(true)
            .setOngoing(indeterminate || progress < 100)

        if (indeterminate || progress < 100) {
            builder.setProgress(100, progress, indeterminate)
        } else {
            builder.setProgress(0, 0, false)
            builder.setSmallIcon(android.R.drawable.stat_sys_upload_done)
            builder.setAutoCancel(true)
        }

        manager.notify(notificationId, builder.build())
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            if (intent?.action == Intent.ACTION_SEND && intent.type?.startsWith("text/") == true) {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                val normalizedUrl = UrlHelper.extractAndNormalizeReelUrl(sharedText)

                if (normalizedUrl != null) {
                    val isLoggedIn = PreferenceManager.isLoggedIn(this)
                    val db = AppDatabase.getDatabase(applicationContext)

                    // 1. Immediate visual progress notification at top (Silent)
                    showProgressNotification("Capturing Reel...", 25, false)
                    Toast.makeText(applicationContext, "Saving to ReelVault...", Toast.LENGTH_SHORT).show()

                    // Background thread saves locally and syncs immediately
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val existing = db.reelDao().getReelByUrl(normalizedUrl)
                            if (existing == null) {
                                val syncStatus = if (isLoggedIn) "local_pending_sync" else "pending_auth"
                                val newReel = LocalReel(
                                    url = normalizedUrl,
                                    rawSharedText = sharedText ?: "",
                                    syncStatus = syncStatus
                                )
                                db.reelDao().insertReel(newReel)
                                showProgressNotification("Uploading Reel to Vault...", 65, false)

                                if (isLoggedIn) {
                                    ReelSyncWorker.syncNow(applicationContext)
                                } else {
                                    ReelSyncWorker.enqueue(applicationContext)
                                }
                                showProgressNotification("Saved to ReelVault", 100, false)
                            } else {
                                // Already in library - trigger immediate sync check just in case
                                if (isLoggedIn) {
                                    ReelSyncWorker.syncNow(applicationContext)
                                }
                                showProgressNotification("Reel already in Vault", 100, false)
                            }
                        } catch (e: Exception) {
                            Log.e("ShareCaptureActivity", "Error saving reel", e)
                            if (isLoggedIn) {
                                ReelSyncWorker.enqueue(applicationContext)
                            }
                            showProgressNotification("Saved locally (offline)", 100, false)
                        }
                    }
                } else {
                    Log.w("ShareCaptureActivity", "Invalid Reel URL: $sharedText")
                    Toast.makeText(applicationContext, "Invalid Instagram Reel link", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            Log.e("ShareCaptureActivity", "Error processing share intent", e)
        } finally {
            finish()
        }
    }
}
