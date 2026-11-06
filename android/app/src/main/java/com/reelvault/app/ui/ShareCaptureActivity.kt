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
 * Shows silent visual notification and handles high-volume back-to-back sharing.
 */
class ShareCaptureActivity : Activity() {

    private val notificationId = 1001
    private val channelId = "watchlater_silent_progress"

    private fun getNotificationManager(): NotificationManager {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = manager.getNotificationChannel(channelId)
            if (existing == null) {
                val channel = NotificationChannel(
                    channelId,
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
        return manager
    }

    private fun showProgressNotification(
        message: String,
        progress: Int,
        pendingCount: Int = 0,
        reshareUrl: String? = null
    ) {
        val manager = getNotificationManager()
        val title = if (pendingCount > 1) "Watch Later ($pendingCount in queue)" else "Watch Later"

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSound(null)
            .setVibrate(null)
            .setOnlyAlertOnce(true)

        if (progress < 100) {
            builder.setProgress(100, progress, false)
            builder.setOngoing(true)
        } else {
            builder.setProgress(0, 0, false)
            builder.setSmallIcon(android.R.drawable.stat_sys_upload_done)
            builder.setAutoCancel(true)

            if (!reshareUrl.isNullOrEmpty()) {
                val reshareIntent = Intent(this, ShareCaptureActivity::class.java).apply {
                    action = Intent.ACTION_SEND
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, reshareUrl)
                    putExtra("force_reshare", true)
                }
                val pendingIntent = android.app.PendingIntent.getActivity(
                    this,
                    reshareUrl.hashCode(),
                    reshareIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                )
                builder.addAction(android.R.drawable.ic_menu_share, "Re-share Reel", pendingIntent)
            }
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
                    val isForceReshare = intent.getBooleanExtra("force_reshare", false)

                    // Immediate visual response
                    showProgressNotification("Capturing Reel...", 20, 1)

                    // Execute synchronously on IO to guarantee persistence before finishing activity
                    kotlinx.coroutines.runBlocking(Dispatchers.IO) {
                        try {
                            val existing = db.reelDao().getReelByUrl(normalizedUrl)
                            val isAlreadySynced = existing != null && (existing.syncStatus == "synced" || existing.remoteId != null)

                            if (existing != null && isAlreadySynced && !isForceReshare) {
                                // Reel already exists in Watch Later
                                kotlinx.coroutines.withContext(Dispatchers.Main) {
                                    Toast.makeText(
                                        applicationContext,
                                        "Reel already in Watch Later! Click Re-share notification if you wish to re-sync.",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                                showProgressNotification(
                                    message = "Reel already exists in Watch Later",
                                    progress = 100,
                                    pendingCount = 0,
                                    reshareUrl = normalizedUrl
                                )
                                return@runBlocking
                            }

                            if (existing == null) {
                                val syncStatus = if (isLoggedIn) "local_pending_sync" else "pending_auth"
                                val newReel = LocalReel(
                                    url = normalizedUrl,
                                    rawSharedText = sharedText ?: "",
                                    syncStatus = syncStatus
                                )
                                db.reelDao().insertReel(newReel)
                            } else {
                                // Re-share or retry sync
                                val resetStatus = if (isLoggedIn) "local_pending_sync" else "pending_auth"
                                db.reelDao().updateReel(existing.copy(syncStatus = resetStatus, remoteId = null))
                            }

                            val pendingList = db.reelDao().getPendingReels()
                            showProgressNotification("Uploading (${pendingList.size} in queue)...", 60, pendingList.size)

                            if (isLoggedIn) {
                                ReelSyncWorker.syncNow(applicationContext)
                            } else {
                                ReelSyncWorker.enqueue(applicationContext)
                            }

                            val remaining = db.reelDao().getPendingReels().size
                            if (remaining == 0) {
                                showProgressNotification("Saved to Watch Later", 100, 0)
                            } else {
                                showProgressNotification("Saved locally ($remaining waiting to upload)", 100, remaining)
                            }
                        } catch (e: Exception) {
                            Log.e("ShareCaptureActivity", "Error queuing reel", e)
                            ReelSyncWorker.enqueue(applicationContext)
                            showProgressNotification("Saved locally (offline)", 100, 0)
                        }
                    }
                } else {
                    Toast.makeText(applicationContext, "Invalid Instagram link", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            Log.e("ShareCaptureActivity", "Error processing share intent", e)
        } finally {
            finish()
        }
    }
}
