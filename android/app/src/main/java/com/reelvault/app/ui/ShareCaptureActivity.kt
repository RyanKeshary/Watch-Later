package com.reelvault.app.ui

import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
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
 * Shows immediate notification pop-up and instant sync.
 */
class ShareCaptureActivity : Activity() {

    private fun showFeedbackNotification(title: String, message: String) {
        val channelId = "reelvault_share_feedback"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "ReelVault Captures",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reel share feedback notifications"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_upload_done)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
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

                    // Show notification and toast immediately before any IO
                    showFeedbackNotification("ReelVault", "Capturing Reel...")
                    Toast.makeText(applicationContext, "Saved to ReelVault", Toast.LENGTH_SHORT).show()

                    // Background thread saves locally and pushes immediately without holding the UI open
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

                                if (isLoggedIn) {
                                    ReelSyncWorker.syncNow(applicationContext)
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("ShareCaptureActivity", "Error saving reel locally", e)
                            if (isLoggedIn) {
                                ReelSyncWorker.enqueue(applicationContext)
                            }
                        }
                    }
                } else {
                    Log.w("ShareCaptureActivity", "Shared text did not contain a valid Instagram Reel URL: $sharedText")
                }
            }
        } catch (e: Exception) {
            Log.e("ShareCaptureActivity", "Error processing share intent", e)
        } finally {
            // Guarantee immediate exit to keep UI invisible and non-blocking
            finish()
        }
    }
}

