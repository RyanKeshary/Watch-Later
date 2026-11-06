package com.reelvault.app.ui

import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.reelvault.app.BuildConfig
import com.reelvault.app.data.AppDatabase
import com.reelvault.app.sync.ReelSyncWorker
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

class MainActivity : ComponentActivity() {

    private val httpClient = HttpClient(Android)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request runtime notification permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var isLoggedIn by remember { mutableStateOf(PreferenceManager.isLoggedIn(this)) }
                    var userEmail by remember { mutableStateOf(PreferenceManager.getUserEmail(this) ?: "") }

                    if (isLoggedIn) {
                        LaunchedEffect(Unit) {
                            lifecycleScope.launch(Dispatchers.IO) {
                                val db = AppDatabase.getDatabase(applicationContext)
                                db.reelDao().markPendingAuthAsPendingSync()
                                ReelSyncWorker.enqueue(applicationContext)
                            }
                        }
                        SettingsScreen(
                            email = userEmail,
                            onLogout = {
                                PreferenceManager.clearSession(this)
                                isLoggedIn = false
                            }
                        )
                    } else {
                        AuthScreen(
                            onAuthSuccess = { email ->
                                userEmail = email
                                isLoggedIn = true
                                // Trigger any pending offline reels
                                lifecycleScope.launch(Dispatchers.IO) {
                                    val db = AppDatabase.getDatabase(applicationContext)
                                    db.reelDao().markPendingAuthAsPendingSync()
                                    ReelSyncWorker.enqueue(applicationContext)
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    @Composable
    fun AuthScreen(onAuthSuccess: (String) -> Unit) {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        var isSignUp by remember { mutableStateOf(false) }
        var isLoading by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "ReelVault",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Silent capture for Instagram Reels",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            OutlinedTextField(
                value = email,
                onValueChange = { email = it; errorMessage = null },
                label = { Text("Email") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it; errorMessage = null },
                label = { Text("Password") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    if (email.isBlank() || password.isBlank()) {
                        errorMessage = "Please enter both email and password"
                        return@Button
                    }
                    isLoading = true
                    lifecycleScope.launch(Dispatchers.IO) {
                        try {
                            val endpoint = if (isSignUp) "signup" else "token?grant_type=password"
                            val payload = buildJsonObject {
                                put("email", email.trim())
                                put("password", password)
                            }.toString()

                            val response = httpClient.post("${BuildConfig.SUPABASE_URL}/auth/v1/$endpoint") {
                                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                contentType(ContentType.Application.Json)
                                setBody(payload)
                            }

                            val responseText = response.bodyAsText()
                            withContext(Dispatchers.Main) {
                                isLoading = false
                                if (response.status.isSuccess()) {
                                    val json = Json.parseToJsonElement(responseText).jsonObject
                                    val session = json["session"]?.jsonObject ?: json
                                    val accessToken = session["access_token"]?.jsonPrimitive?.content
                                    val refreshToken = session["refresh_token"]?.jsonPrimitive?.content
                                    val user = session["user"]?.jsonObject ?: json["user"]?.jsonObject
                                    val userId = user?.get("id")?.jsonPrimitive?.content ?: ""

                                    if (accessToken != null && refreshToken != null) {
                                        PreferenceManager.saveSession(
                                            this@MainActivity,
                                            userId = userId,
                                            email = email.trim(),
                                            accessToken = accessToken,
                                            refreshToken = refreshToken
                                        )
                                        // Register device row
                                        lifecycleScope.launch(Dispatchers.IO) {
                                            registerDevice(accessToken, userId)
                                        }
                                        onAuthSuccess(email.trim())
                                    } else {
                                        if (isSignUp) {
                                            errorMessage = "Sign up successful! Please check your email to confirm, then sign in."
                                            isSignUp = false
                                        } else {
                                            errorMessage = "Session tokens missing in response."
                                        }
                                    }
                                } else {
                                    val parsedErr = runCatching {
                                        Json.parseToJsonElement(responseText).jsonObject["msg"]?.jsonPrimitive?.content
                                            ?: Json.parseToJsonElement(responseText).jsonObject["error_description"]?.jsonPrimitive?.content
                                    }.getOrNull()
                                    errorMessage = parsedErr ?: "Authentication failed (${response.status.value})"
                                }
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                isLoading = false
                                errorMessage = e.localizedMessage ?: "Network error"
                            }
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text(if (isSignUp) "Sign Up" else "Sign In")
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(
                onClick = { isSignUp = !isSignUp; errorMessage = null },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (isSignUp) "Already have an account? Sign In" else "Don't have an account? Sign Up")
            }
        }
    }

    @Composable
    fun SettingsScreen(email: String, onLogout: () -> Unit) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "ReelVault Connected",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Signed in as:\n$email",
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text("Log Out")
            }
        }
    }

    private suspend fun registerDevice(token: String, userId: String) {
        try {
            val devicePayload = buildJsonObject {
                put("user_id", userId)
                put("platform", "android")
                put("device_name", "${Build.MANUFACTURER} ${Build.MODEL}")
            }.toString()

            httpClient.post("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                header("Authorization", "Bearer $token")
                contentType(ContentType.Application.Json)
                setBody(devicePayload)
            }
        } catch (e: Exception) {
            // Non-critical device registration error
        }
    }
}

