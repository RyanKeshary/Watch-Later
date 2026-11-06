package com.reelvault.app.sync

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.BackoffPolicy
import com.reelvault.app.BuildConfig
import com.reelvault.app.data.AppDatabase
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

    private val httpClient = HttpClient(Android)

    override suspend fun doWork(): Result {
        val db = AppDatabase.getDatabase(context)
        val dao = db.reelDao()

        var accessToken = PreferenceManager.getAccessToken(context)
        val refreshToken = PreferenceManager.getRefreshToken(context)
        val userId = PreferenceManager.getUserId(context)
        val userEmail = PreferenceManager.getUserEmail(context)

        if (accessToken.isNullOrEmpty() || userId.isNullOrEmpty()) {
            Log.w("ReelSyncWorker", "User not authenticated; syncing deferred until login.")
            return Result.retry()
        }

        val pendingReels = dao.getPendingReels()
        if (pendingReels.isEmpty()) {
            return Result.success()
        }

        // Auto-refresh token if expired using Supabase refresh-token grant
        suspend fun tryRefreshToken(): Boolean {
            if (refreshToken.isNullOrEmpty()) return false
            return try {
                val refreshPayload = buildJsonObject {
                    put("refresh_token", refreshToken)
                }.toString()

                val refreshResponse = httpClient.post("${BuildConfig.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token") {
                    header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    contentType(ContentType.Application.Json)
                    setBody(refreshPayload)
                }

                if (refreshResponse.status.isSuccess()) {
                    val json = Json.parseToJsonElement(refreshResponse.bodyAsText()).jsonObject
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

                var response = httpClient.post("${BuildConfig.SUPABASE_URL}/rest/v1/reels") {
                    header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    header("Authorization", "Bearer $accessToken")
                    header("Prefer", "return=representation")
                    contentType(ContentType.Application.Json)
                    setBody(payload)
                }

                // If JWT expired (401), refresh and retry request once
                if (response.status.value == 401 && tryRefreshToken()) {
                    response = httpClient.post("${BuildConfig.SUPABASE_URL}/rest/v1/reels") {
                        header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                        header("Authorization", "Bearer $accessToken")
                        header("Prefer", "return=representation")
                        contentType(ContentType.Application.Json)
                        setBody(payload)
                    }
                }

                if (response.status.isSuccess()) {
                    val responseBody = response.bodyAsText()
                    val parsed = Json.parseToJsonElement(responseBody).jsonArray
                    val remoteId = parsed.firstOrNull()?.jsonObject?.get("id")?.jsonPrimitive?.content ?: ""
                    dao.markSynced(reel.id, remoteId, "synced")
                    Log.i("ReelSyncWorker", "Successfully synced reel: ${reel.url} -> remoteId: $remoteId")
                } else {
                    Log.e("ReelSyncWorker", "Failed to sync reel HTTP ${response.status.value}: ${response.bodyAsText()}")
                    return Result.retry()
                }
            } catch (e: Exception) {
                Log.e("ReelSyncWorker", "Exception during sync for reel ${reel.id}", e)
                return Result.retry()
            }
        }

        return Result.success()
    }

    companion object {
        fun enqueue(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<ReelSyncWorker>()
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueue(request)
        }
    }
}

