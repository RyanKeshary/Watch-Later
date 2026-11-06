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
                val refreshToken = PreferenceManager.getRefreshToken(context)
                val userId = PreferenceManager.getUserId(context)
                val userEmail = PreferenceManager.getUserEmail(context)

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
                        if (refreshToken.isNullOrEmpty()) return false
                        return try {
                            val refRes = client.post("${BuildConfig.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token") {
                                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                contentType(ContentType.Application.Json)
                                setBody(buildJsonObject { put("refresh_token", refreshToken) }.toString())
                            }
                            if (refRes.status.isSuccess()) {
                                val json = Json.parseToJsonElement(refRes.bodyAsText()).jsonObject
                                val newAccess = json["access_token"]?.jsonPrimitive?.content
                                val newRefresh = json["refresh_token"]?.jsonPrimitive?.content ?: refreshToken
                                if (newAccess != null) {
                                    PreferenceManager.saveSession(context, userId, userEmail ?: "", newAccess, newRefresh)
                                    accessToken = newAccess
                                    true
                                } else false
                            } else false
                        } catch (e: Exception) {
                            false
                        }
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
