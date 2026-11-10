package com.reelvault.app.util

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import io.ktor.client.HttpClient
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
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

object PreferenceManager {
    private const val PREF_NAME = "reelvault_secure_prefs"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_REFRESH_TOKEN = "refresh_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_USER_EMAIL = "user_email"
    private const val KEY_DEVICE_REGISTERED = "device_registered"
    private const val KEY_LAST_SYNC_TS = "last_sync_timestamp"

    private fun getPrefs(context: Context) = EncryptedSharedPreferences.create(
        context,
        PREF_NAME,
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val sessionLock = Any()
    private val refreshMutex = Mutex()

    fun saveSession(context: Context, userId: String, email: String, accessToken: String, refreshToken: String) {
        synchronized(sessionLock) {
            getPrefs(context).edit()
                .putString(KEY_USER_ID, userId)
                .putString(KEY_USER_EMAIL, email)
                .putString(KEY_ACCESS_TOKEN, accessToken)
                .putString(KEY_REFRESH_TOKEN, refreshToken)
                .apply()
        }
    }

    fun setDeviceRegistered(context: Context, registered: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_DEVICE_REGISTERED, registered).apply()
    }

    fun isDeviceRegistered(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_DEVICE_REGISTERED, false)
    }

    fun getLastSyncTimestamp(context: Context): String? {
        return getPrefs(context).getString(KEY_LAST_SYNC_TS, null)
    }

    fun setLastSyncTimestamp(context: Context, timestamp: String) {
        getPrefs(context).edit().putString(KEY_LAST_SYNC_TS, timestamp).apply()
    }

    fun clearSession(context: Context) {
        synchronized(sessionLock) {
            getPrefs(context).edit().clear().apply()
        }
    }

    fun isLoggedIn(context: Context): Boolean {
        return !getPrefs(context).getString(KEY_ACCESS_TOKEN, null).isNullOrEmpty()
    }

    fun getUserId(context: Context): String? = getPrefs(context).getString(KEY_USER_ID, null)
    fun getUserEmail(context: Context): String? = getPrefs(context).getString(KEY_USER_EMAIL, null)
    fun getAccessToken(context: Context): String? = getPrefs(context).getString(KEY_ACCESS_TOKEN, null)
    fun getRefreshToken(context: Context): String? = getPrefs(context).getString(KEY_REFRESH_TOKEN, null)

    fun getDeviceName(): String = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"

    fun sanitizeForLike(input: String): String =
        input.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

    fun extractBaseDeviceName(rawName: String): String =
        rawName.replace(Regex("\\s*\\[synced:.*?\\]"), "").trim()

    fun isDeviceNameMatch(rawName: String, targetDeviceName: String = getDeviceName()): Boolean =
        extractBaseDeviceName(rawName) == targetDeviceName

    suspend fun refreshSession(context: Context, client: io.ktor.client.HttpClient): String? {
        return refreshMutex.withLock {
            val refreshToken = getRefreshToken(context) ?: return@withLock null
            val userId = getUserId(context) ?: return@withLock null
            val userEmail = getUserEmail(context) ?: ""
            try {
                val res = client.post("${com.reelvault.app.BuildConfig.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token") {
                    header("apikey", com.reelvault.app.BuildConfig.SUPABASE_ANON_KEY)
                    contentType(io.ktor.http.ContentType.Application.Json)
                    setBody(kotlinx.serialization.json.buildJsonObject {
                        put("refresh_token", refreshToken)
                    }.toString())
                }
                if (res.status.isSuccess()) {
                    val json = kotlinx.serialization.json.Json.parseToJsonElement(res.bodyAsText()).jsonObject
                    val newAccess = json["access_token"]?.jsonPrimitive?.content
                    val newRefresh = json["refresh_token"]?.jsonPrimitive?.content ?: refreshToken
                    if (newAccess != null) {
                        synchronized(sessionLock) {
                            val currentRefreshToken = getRefreshToken(context)
                            if (currentRefreshToken == refreshToken) {
                                saveSession(context, userId, userEmail, newAccess, newRefresh)
                                newAccess
                            } else if (getUserId(context) == userId) {
                                getAccessToken(context)
                            } else {
                                null
                            }
                        }
                    } else null
                } else {
                    synchronized(sessionLock) {
                        val currentRefreshToken = getRefreshToken(context)
                        if (currentRefreshToken != null && currentRefreshToken != refreshToken && getUserId(context) == userId) {
                            getAccessToken(context)
                        } else {
                            null
                        }
                    }
                }
            } catch (ce: kotlinx.coroutines.CancellationException) {
                throw ce
            } catch (e: Exception) {
                synchronized(sessionLock) {
                    val currentRefreshToken = getRefreshToken(context)
                    if (currentRefreshToken != null && currentRefreshToken != refreshToken && getUserId(context) == userId) {
                        getAccessToken(context)
                    } else {
                        null
                    }
                }
            }
        }
    }
}

