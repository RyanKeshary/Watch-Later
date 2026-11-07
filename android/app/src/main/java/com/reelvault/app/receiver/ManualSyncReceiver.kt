package com.reelvault.app.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.reelvault.app.sync.ReelSyncWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ManualSyncReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                ReelSyncWorker.syncNow(context.applicationContext)
            } catch (e: Exception) {
                Log.e("ManualSyncReceiver", "Error triggering manual sync from notification", e)
            } finally {
                pendingResult.finish()
            }
        }
    }
}

