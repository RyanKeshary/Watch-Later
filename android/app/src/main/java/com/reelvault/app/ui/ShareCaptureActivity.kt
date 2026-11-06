package com.reelvault.app.ui

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
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
 * Target: immediate extraction, Room insertion, WorkManager dispatch, and finish() in < 300ms.
 */
class ShareCaptureActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            if (intent?.action == Intent.ACTION_SEND && intent.type?.startsWith("text/") == true) {
                val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                val normalizedUrl = UrlHelper.extractAndNormalizeReelUrl(sharedText)

                if (normalizedUrl != null) {
                    val isLoggedIn = PreferenceManager.isLoggedIn(this)
                    val db = AppDatabase.getDatabase(applicationContext)

                    // Execute Room save & WorkManager sync on IO and finish safely
                    kotlinx.coroutines.runBlocking(Dispatchers.IO) {
                        try {
                            val existing = db.reelDao().getReelByUrl(normalizedUrl)
                            if (existing != null) {
                                runOnUiThread {
                                    Toast.makeText(applicationContext, "Already saved", Toast.LENGTH_SHORT).show()
                                }
                            } else {
                                val syncStatus = if (isLoggedIn) "local_pending_sync" else "pending_auth"
                                val newReel = LocalReel(
                                    url = normalizedUrl,
                                    rawSharedText = sharedText ?: "",
                                    syncStatus = syncStatus
                                )
                                db.reelDao().insertReel(newReel)

                                if (isLoggedIn) {
                                    ReelSyncWorker.enqueue(applicationContext)
                                }
                                runOnUiThread {
                                    Toast.makeText(applicationContext, "Saved to ReelVault", Toast.LENGTH_SHORT).show()
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("ShareCaptureActivity", "Error saving reel locally", e)
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

