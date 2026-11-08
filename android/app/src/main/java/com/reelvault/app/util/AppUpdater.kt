package com.reelvault.app.util

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.content.FileProvider
import com.reelvault.app.BuildConfig
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class AppVersionInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val releaseNotes: String? = null
)

object AppUpdater {
    private const val VERSION_URL = "https://watchlatertool.vercel.app/version.json"
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun checkForUpdate(): AppVersionInfo? = withContext(Dispatchers.IO) {
        val client = HttpClient(Android)
        try {
            val response = client.get(VERSION_URL)
            if (response.status.isSuccess()) {
                val info = json.decodeFromString<AppVersionInfo>(response.bodyAsText())
                if (info.versionCode > BuildConfig.VERSION_CODE) {
                    return@withContext info
                }
            }
        } catch (e: Exception) {
            Log.w("AppUpdater", "Update check failed: ${e.message}")
        } finally {
            client.close()
        }
        null
    }

    fun startDownloadAndInstall(context: Context, info: AppVersionInfo) {
        try {
            val filename = "watch-later-v${info.versionName}.apk"
            val destination = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), filename)
            if (destination.exists()) {
                destination.delete()
            }

            val request = DownloadManager.Request(Uri.parse(info.apkUrl))
                .setTitle("Downloading Watch Later Update")
                .setDescription("Version ${info.versionName}")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationUri(Uri.fromFile(destination))
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = dm.enqueue(request)

            val onCompleteReceiver = object : BroadcastReceiver() {
                override fun onReceive(recvContext: Context, intent: Intent) {
                    val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                    if (id == downloadId) {
                        try {
                            recvContext.unregisterReceiver(this)
                        } catch (_: Exception) {}
                        installApk(recvContext, destination)
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(
                    onCompleteReceiver,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                context.registerReceiver(
                    onCompleteReceiver,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
                )
            }
        } catch (e: Exception) {
            Log.e("AppUpdater", "Error starting update download", e)
            // Fallback: open browser to apkUrl
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(info.apkUrl)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(browserIntent)
        }
    }

    fun installApk(context: Context, apkFile: File) {
        try {
            if (!apkFile.exists()) return

            val contentUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(installIntent)
        } catch (e: Exception) {
            Log.e("AppUpdater", "Error launching APK installer", e)
        }
    }
}

