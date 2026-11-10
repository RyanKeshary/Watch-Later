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

enum class UpdateResult {
    SUCCESS,
    PERMISSION_REQUIRED,
    BROWSER_OPENED,
    FAILED
}

enum class InstallResult {
    SUCCESS,
    PERMISSION_REQUIRED,
    NO_PENDING,
    FAILED
}

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

    fun startDownloadAndInstall(
        context: Context,
        info: AppVersionInfo,
        onFinished: (result: UpdateResult) -> Unit = {}
    ) {
        val appContext = context.applicationContext
        try {
            val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            pendingInstallFile = null
            prefs.edit().remove(KEY_PENDING_APK).apply()

            val filename = "watch-later-v${info.versionName}.apk"
            val destination = File(appContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), filename)
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

            val dm = appContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = dm.enqueue(request)

            val onCompleteReceiver = object : BroadcastReceiver() {
                override fun onReceive(recvContext: Context, intent: Intent) {
                    val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                    if (id == downloadId) {
                        try {
                            appContext.unregisterReceiver(this)
                        } catch (_: Exception) {}

                        var isSuccess = false
                        try {
                            val query = DownloadManager.Query().setFilterById(downloadId)
                            dm.query(query)?.use { cursor ->
                                if (cursor.moveToFirst()) {
                                    val statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                                    if (statusIdx != -1 && cursor.getInt(statusIdx) == DownloadManager.STATUS_SUCCESSFUL) {
                                        isSuccess = true
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            Log.w("AppUpdater", "Error querying download status", e)
                        }

                        if (isSuccess) {
                            val prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                            pendingInstallFile = destination
                            prefs.edit().putString(KEY_PENDING_APK, destination.absolutePath).apply()

                            if (com.reelvault.app.ReelVaultApp.isAppInForeground) {
                                val installRes = installApk(appContext, destination)
                                val outcome = when (installRes) {
                                    InstallResult.SUCCESS -> UpdateResult.SUCCESS
                                    InstallResult.PERMISSION_REQUIRED -> UpdateResult.PERMISSION_REQUIRED
                                    InstallResult.FAILED, InstallResult.NO_PENDING -> UpdateResult.FAILED
                                }
                                onFinished(outcome)
                            } else {
                                onFinished(UpdateResult.SUCCESS)
                            }
                        } else {
                            onFinished(UpdateResult.FAILED)
                        }
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                appContext.registerReceiver(
                    onCompleteReceiver,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                appContext.registerReceiver(
                    onCompleteReceiver,
                    IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
                )
            }
        } catch (e: Exception) {
            Log.e("AppUpdater", "Error starting update download", e)
            var browserOpened = false
            try {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(info.apkUrl)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                appContext.startActivity(browserIntent)
                browserOpened = true
            } catch (fallbackErr: Exception) {
                Log.e("AppUpdater", "Browser fallback failed", fallbackErr)
            }
            onFinished(if (browserOpened) UpdateResult.BROWSER_OPENED else UpdateResult.FAILED)
        }
    }

    private const val PREFS_NAME = "app_updater_prefs"
    private const val KEY_PENDING_APK = "pending_apk_path"

    @Volatile
    private var pendingInstallFile: File? = null

    suspend fun checkAndInstallPending(context: Context): InstallResult {
        val (file, canInstall) = withContext(Dispatchers.IO) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val savedPath = prefs.getString(KEY_PENDING_APK, null)
            val f = pendingInstallFile ?: savedPath?.let { File(it) } ?: return@withContext null

            if (!f.exists()) {
                pendingInstallFile = null
                prefs.edit().remove(KEY_PENDING_APK).apply()
                return@withContext null
            }

            // Validate that the pending APK is still newer than the running version and belongs to this package
            val pkgInfo = context.packageManager.getPackageArchiveInfo(f.absolutePath, 0)
            val apkVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pkgInfo?.longVersionCode?.toInt()
            } else {
                @Suppress("DEPRECATION")
                pkgInfo?.versionCode
            }
            if (pkgInfo == null || pkgInfo.packageName != context.packageName || apkVersionCode == null || apkVersionCode <= BuildConfig.VERSION_CODE) {
                pendingInstallFile = null
                prefs.edit().remove(KEY_PENDING_APK).apply()
                if (f.exists()) f.delete()
                return@withContext null
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
                return@withContext Pair(f, false)
            }
            Pair(f, true)
        } ?: return InstallResult.NO_PENDING

        if (!canInstall) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            pendingInstallFile = file
            prefs.edit().putString(KEY_PENDING_APK, file.absolutePath).apply()
            return InstallResult.PERMISSION_REQUIRED
        }

        val res = installApk(context, file)
        if (res == InstallResult.SUCCESS || res == InstallResult.FAILED) {
            pendingInstallFile = null
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().remove(KEY_PENDING_APK).apply()
        }
        return res
    }

    fun installApk(context: Context, apkFile: File): InstallResult {
        return try {
            if (!apkFile.exists()) return InstallResult.FAILED

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!context.packageManager.canRequestPackageInstalls()) {
                    pendingInstallFile = apkFile
                    prefs.edit().putString(KEY_PENDING_APK, apkFile.absolutePath).apply()
                    val settingsIntent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(settingsIntent)
                    return InstallResult.PERMISSION_REQUIRED
                }
            }
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

            pendingInstallFile = null
            prefs.edit().remove(KEY_PENDING_APK).apply()

            InstallResult.SUCCESS
        } catch (e: Exception) {
            Log.e("AppUpdater", "Error launching APK installer", e)
            InstallResult.FAILED
        }
    }
}

