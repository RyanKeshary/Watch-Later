package com.reelvault.app.sync

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.BackoffPolicy
import androidx.work.ExistingWorkPolicy
import com.reelvault.app.BuildConfig
import com.reelvault.app.data.AppDatabase
import com.reelvault.app.data.LocalReel
import com.reelvault.app.util.PreferenceManager
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.util.concurrent.TimeUnit

class ReelSyncWorker(
    private val context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val allSynced = syncInternal(context)
        return if (allSynced) {
            Result.success()
        } else {
            Result.retry()
        }
    }

    companion object {
        private val syncMutex = Mutex()

        suspend fun syncNow(context: Context) {
            val allSynced = syncInternal(context)
            if (!allSynced) {
                enqueue(context)
            }
        }

        private suspend fun syncInternal(context: Context): Boolean {
            return syncMutex.withLock {
                val db = AppDatabase.getDatabase(context)
                val dao = db.reelDao()

                var accessToken = PreferenceManager.getAccessToken(context)
                val userId = PreferenceManager.getUserId(context)

                if (accessToken.isNullOrEmpty() || userId.isNullOrEmpty()) {
                    Log.w("ReelSyncWorker", "User not logged in; skipping sync.")
                    return@withLock false
                }

                // Fetch ALL queued reels (handles back-to-back spam)
                val pendingReels = dao.getPendingReels()
                if (pendingReels.isEmpty()) {
                    return@withLock true
                }

                val client = HttpClient(Android)
                var allSucceeded = true

                try {
                    suspend fun refreshTokenCall(): Boolean {
                        val refreshed = PreferenceManager.refreshSession(context, client)
                        return if (refreshed != null) {
                            accessToken = refreshed
                            true
                        } else false
                    }

                    // Remote device registration check: if removed from web dashboard, deregister locally
                    try {
                        val deviceName = PreferenceManager.getDeviceName()
                        val sanitizedName = PreferenceManager.sanitizeForLike(deviceName)
                        var checkRes = client.get("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                            header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                            header("Authorization", "Bearer $accessToken")
                            url {
                                parameters.append("user_id", "eq.$userId")
                                parameters.append("device_name", "like.$sanitizedName*")
                                parameters.append("select", "id,device_name")
                            }
                        }
                        if (checkRes.status.value == 401 && refreshTokenCall()) {
                            checkRes = client.get("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                header("Authorization", "Bearer $accessToken")
                                url {
                                    parameters.append("user_id", "eq.$userId")
                                    parameters.append("device_name", "like.$sanitizedName*")
                                    parameters.append("select", "id,device_name")
                                }
                            }
                        }
                        if (checkRes.status.value in 200..299) {
                            val body = checkRes.bodyAsText().trim()
                            val parsedArray = runCatching { Json.parseToJsonElement(body).jsonArray }.getOrNull()
                            if (parsedArray != null) {
                                val hasDevice = parsedArray.any { el ->
                                    val rawName = el.jsonObject["device_name"]?.jsonPrimitive?.content ?: ""
                                    PreferenceManager.isDeviceNameMatch(rawName, deviceName)
                                }
                                if (!hasDevice) {
                                    Log.w("ReelSyncWorker", "Device deregistered on web dashboard. Clearing local session.")
                                    PreferenceManager.clearSession(context)
                                    return@withLock true
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.w("ReelSyncWorker", "Device registration check skipped: ${e.message}")
                    }

                    for (reel in pendingReels) {
                        try {
                            val payload = buildJsonObject {
                                put("user_id", userId)
                                put("url", reel.url)
                                put("raw_shared_text", reel.rawSharedText)
                                put("processing_status", "pending")
                                put("completion_status", "pending")
                            }.toString()

                            var response = client.post("${BuildConfig.SUPABASE_URL}/rest/v1/reels") {
                                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                header("Authorization", "Bearer $accessToken")
                                header("Prefer", "return=representation")
                                contentType(ContentType.Application.Json)
                                setBody(payload)
                            }

                            if (response.status.value == 401 && refreshTokenCall()) {
                                response = client.post("${BuildConfig.SUPABASE_URL}/rest/v1/reels") {
                                    header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                    header("Authorization", "Bearer $accessToken")
                                    header("Prefer", "return=representation")
                                    contentType(ContentType.Application.Json)
                                    setBody(payload)
                                }
                            }

                            if (response.status.isSuccess()) {
                                val parsed = Json.parseToJsonElement(response.bodyAsText()).jsonArray
                                val remoteId = parsed.firstOrNull()?.jsonObject?.get("id")?.jsonPrimitive?.content ?: ""
                                dao.markSynced(reel.id, remoteId, "synced")
                                Log.i("ReelSyncWorker", "Synced: ${reel.url} -> $remoteId")
                            } else {
                                val statusCode = response.status.value
                                Log.w("ReelSyncWorker", "HTTP $statusCode for reel ${reel.id}")
                                if (statusCode in 400..499 && statusCode != 401 && statusCode != 408 && statusCode != 429) {
                                    // Permanent client error (e.g. duplicate key, validation violation)
                                    dao.markSynced(reel.id, "", "failed_permanent")
                                    Log.e("ReelSyncWorker", "Permanent 4xx ($statusCode) for reel ${reel.id}; marking permanent failure.")
                                } else {
                                    allSucceeded = false
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("ReelSyncWorker", "Sync exception for ${reel.id}", e)
                            allSucceeded = false
                        }
                    }
                } finally {
                    client.close()
                }

                allSucceeded
            }
        }

        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<ReelSyncWorker>()
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                "ReelSyncQueue",
                ExistingWorkPolicy.APPEND_OR_REPLACE,
                request
            )
        }
    }
}
