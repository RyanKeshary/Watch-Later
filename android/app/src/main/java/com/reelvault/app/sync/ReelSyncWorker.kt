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

        val accessToken = PreferenceManager.getAccessToken(context)
        val userId = PreferenceManager.getUserId(context)

        if (accessToken.isNullOrEmpty() || userId.isNullOrEmpty()) {
            Log.w("ReelSyncWorker", "User not authenticated; syncing deferred until login.")
            return Result.retry()
        }

        val pendingReels = dao.getPendingReels()
        if (pendingReels.isEmpty()) {
            return Result.success()
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

                val response = httpClient.post("${BuildConfig.SUPABASE_URL}/rest/v1/reels") {
                    header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    header("Authorization", "Bearer $accessToken")
                    header("Prefer", "return=representation")
                    contentType(ContentType.Application.Json)
                    setBody(payload)
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

