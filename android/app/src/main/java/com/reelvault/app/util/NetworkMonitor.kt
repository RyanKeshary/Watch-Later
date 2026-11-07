package com.reelvault.app.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.reelvault.app.data.AppDatabase
import com.reelvault.app.receiver.ManualSyncReceiver
import com.reelvault.app.sync.ReelSyncWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

object NetworkMonitor {

    private const val TAG = "NetworkMonitor"
    private const val CHANNEL_ID = "watchlater_status"
    private const val NOTIF_ID_ONLINE = 2001
    private const val NOTIF_ID_OFFLINE = 2002

    @Volatile
    private var isInitialized = false

    @Volatile
    private var lastKnownOnline: Boolean? = null

    private val initLock = Any()
    private val handlerMutex = Mutex()

    fun isOnline(context: Context): Boolean {
        val cm = context.applicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false
        val active = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(active) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    fun start(context: Context) {
        if (isInitialized) return

        synchronized(initLock) {
            if (isInitialized) return
            val appContext = context.applicationContext
            createNotificationChannel(appContext)

            val connectivityManager = appContext.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            if (connectivityManager == null) {
                Log.w(TAG, "ConnectivityManager unavailable; cannot start NetworkMonitor")
                return
            }

            // Initialize state atomically
            val activeNetwork = connectivityManager.activeNetwork
            val caps = connectivityManager.getNetworkCapabilities(activeNetwork)
            val initialOnline = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true &&
                    caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
            lastKnownOnline = initialOnline

            val networkRequest = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            connectivityManager.registerNetworkCallback(networkRequest, object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    val currentCaps = connectivityManager.getNetworkCapabilities(network)
                    val isValidated = currentCaps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true &&
                            currentCaps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                    if (isValidated) {
                        Log.d(TAG, "Network became available and validated")
                        handleNetworkChange(appContext)
                    }
                }

                override fun onLost(network: Network) {
                    val active = connectivityManager.activeNetwork
                    val activeCaps = connectivityManager.getNetworkCapabilities(active)
                    val stillOnline = activeCaps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true &&
                            activeCaps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                    if (stillOnline) {
                        Log.d(TAG, "Network lost, but alternate validated network remains active")
                        handleNetworkChange(appContext)
                    } else {
                        Log.d(TAG, "Network lost and no alternate validated network available")
                        handleNetworkChange(appContext)
                    }
                }

                override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
                    val isValidated = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                    if (isValidated && lastKnownOnline != true) {
                        Log.d(TAG, "Validated capability transition to online")
                        handleNetworkChange(appContext)
                    } else if (!isValidated && lastKnownOnline == true) {
                        Log.d(TAG, "Network no longer validated; transition to offline")
                        handleNetworkChange(appContext)
                    }
                }
            })

            // Register default network callback on API 24+ to observe default-network switches
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                connectivityManager.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        Log.d(TAG, "Default network changed/available")
                        handleNetworkChange(appContext)
                    }

                    override fun onLost(network: Network) {
                        Log.d(TAG, "Default network lost")
                        handleNetworkChange(appContext)
                    }

                    override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                        Log.d(TAG, "Default network capabilities updated")
                        handleNetworkChange(appContext)
                    }
                })
            }

            // Only mark initialized when setup successfully completes
            isInitialized = true
        }
    }

    private fun handleNetworkChange(context: Context) {
        CoroutineScope(Dispatchers.IO).launch {
            handlerMutex.withLock {
                val currentOnline = isOnline(context)
                val previousState = lastKnownOnline
                lastKnownOnline = currentOnline

                val db = AppDatabase.getDatabase(context)
                val pendingReels = db.reelDao().getPendingReels()

                if (currentOnline) {
                    // Always dismiss offline notification when back online
                    dismissNotification(context, NOTIF_ID_OFFLINE)

                    if (pendingReels.isNotEmpty()) {
                        ReelSyncWorker.syncNow(context)

                        val remaining = db.reelDao().getPendingReels()
                        if (remaining.isNotEmpty()) {
                            showConnectedClickToSyncNotification(context, remaining.size)
                        } else {
                            dismissNotification(context, NOTIF_ID_ONLINE)
                        }
                    } else {
                        dismissNotification(context, NOTIF_ID_ONLINE)
                    }
                } else {
                    if (previousState == true || pendingReels.isNotEmpty()) {
                        dismissNotification(context, NOTIF_ID_ONLINE)
                        showOfflineNotification(context, pendingReels.size)
                    }
                }
            }
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Watch Later Status Alerts",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Connection and sync status alerts"
            }
            manager.createNotificationChannel(channel)
        }
    }

    fun showConnectedClickToSyncNotification(context: Context, pendingCount: Int) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val syncIntent = Intent(context, ManualSyncReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            syncIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setContentTitle("Connected to Server")
            .setContentText("You are back online. Click to sync $pendingCount saved reel(s) now.")
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .addAction(android.R.drawable.ic_popup_sync, "Sync Now", pendingIntent)
            .build()

        manager.notify(NOTIF_ID_ONLINE, notif)
    }

    fun showOfflineNotification(context: Context, pendingCount: Int) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val contentMsg = if (pendingCount > 0) {
            "Your device is offline. $pendingCount saved reel(s) are stored safely and will sync automatically once reconnected."
        } else {
            "Your device is offline. Any reels you share will be stored locally and synced once reconnected."
        }

        val notif = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("Device is Offline")
            .setContentText(contentMsg)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentMsg))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        manager.notify(NOTIF_ID_OFFLINE, notif)
    }

    private fun dismissNotification(context: Context, notifId: Int) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notifId)
    }
}
