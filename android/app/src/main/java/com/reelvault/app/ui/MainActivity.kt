package com.reelvault.app.ui

import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PointMode
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.reelvault.app.BuildConfig
import com.reelvault.app.data.AppDatabase
import com.reelvault.app.sync.ReelSyncWorker
import com.reelvault.app.ui.theme.DarkBg
import com.reelvault.app.ui.theme.DarkBorder
import com.reelvault.app.ui.theme.DarkMuted
import com.reelvault.app.ui.theme.DarkSurface
import com.reelvault.app.ui.theme.LightText
import com.reelvault.app.ui.theme.PureWhite
import com.reelvault.app.ui.theme.WatchLaterDarkColorScheme
import com.reelvault.app.util.AppUpdater
import com.reelvault.app.util.AppVersionInfo
import com.reelvault.app.util.PreferenceManager
import com.reelvault.app.util.UpdateResult
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
    private var isFirstResume = true
    private var isLoggedInState: MutableState<Boolean>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request runtime notification permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        setContent {
            MaterialTheme(colorScheme = WatchLaterDarkColorScheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkBg
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .drawWithCache {
                                val dotSpacing = 20.dp.toPx()
                                val dotStrokeWidth = 2.dp.toPx() // Diameter of 1.dp radius
                                val dotColor1 = Color.White.copy(alpha = 0.12f)
                                val dotColor2 = Color.White.copy(alpha = 0.06f)

                                val points1 = mutableListOf<Offset>()
                                val points2 = mutableListOf<Offset>()

                                var x = 0f
                                while (x < size.width) {
                                    var y = 0f
                                    while (y < size.height) {
                                        points1.add(Offset(x, y))
                                        points2.add(Offset(x + dotSpacing / 2f, y + dotSpacing / 2f))
                                        y += dotSpacing
                                    }
                                    x += dotSpacing
                                }

                                onDrawBehind {
                                    drawPoints(
                                        points = points1,
                                        pointMode = PointMode.Points,
                                        color = dotColor1,
                                        strokeWidth = dotStrokeWidth,
                                        cap = StrokeCap.Round
                                    )
                                    drawPoints(
                                        points = points2,
                                        pointMode = PointMode.Points,
                                        color = dotColor2,
                                        strokeWidth = dotStrokeWidth,
                                        cap = StrokeCap.Round
                                    )
                                }
                            }
                    ) {
                        val isLoggedIn = remember { mutableStateOf(PreferenceManager.isLoggedIn(this@MainActivity)) }
                        isLoggedInState = isLoggedIn
                        var userEmail by remember { mutableStateOf(PreferenceManager.getUserEmail(this@MainActivity) ?: "") }
                        var availableUpdate by remember { mutableStateOf<AppVersionInfo?>(null) }
                        var isDownloadingUpdate by remember { mutableStateOf(false) }

                        // Check for in-app update on launch
                        LaunchedEffect(Unit) {
                            val update = AppUpdater.checkForUpdate()
                            if (update != null) {
                                availableUpdate = update
                            }
                        }

                        if (isLoggedIn.value) {
                            LaunchedEffect(Unit) {
                                lifecycleScope.launch(Dispatchers.IO) {
                                    // 1. Verify remote device registration in Supabase
                                    val isStillRegistered = checkDeviceRegistration()
                                    if (!isStillRegistered) {
                                        withContext(Dispatchers.Main) {
                                            PreferenceManager.clearSession(this@MainActivity)
                                            isLoggedIn.value = false
                                            Toast.makeText(this@MainActivity, "Device removed from dashboard. Signed out.", Toast.LENGTH_LONG).show()
                                        }
                                        return@launch
                                    }

                                    // 2. Trigger sync of any pending reels
                                    val db = AppDatabase.getDatabase(applicationContext)
                                    db.reelDao().markPendingAuthAsPendingSync()
                                    ReelSyncWorker.enqueue(applicationContext)

                                    // 3. Periodic fast polling (every 4s) while app is open to detect remote de-registration instantly
                                    while (PreferenceManager.isLoggedIn(this@MainActivity)) {
                                        kotlinx.coroutines.delay(4000)
                                        val stillValid = checkDeviceRegistration()
                                        if (!stillValid) {
                                            withContext(Dispatchers.Main) {
                                                PreferenceManager.clearSession(this@MainActivity)
                                                isLoggedIn.value = false
                                                Toast.makeText(this@MainActivity, "Device removed from dashboard. Signed out.", Toast.LENGTH_LONG).show()
                                            }
                                            break
                                        }
                                    }
                                }
                            }
                            SettingsScreen(
                                email = userEmail,
                                availableUpdate = availableUpdate,
                                isDownloadingUpdate = isDownloadingUpdate,
                                onUpdateClick = {
                                    availableUpdate?.let { info ->
                                        isDownloadingUpdate = true
                                        Toast.makeText(this@MainActivity, "Starting update download...", Toast.LENGTH_SHORT).show()

                                        // Bounded 10-minute timeout watchdog to clear download spinner if download hangs or is cancelled
                                        val watchdogJob = lifecycleScope.launch {
                                            kotlinx.coroutines.delay(600_000L)
                                            if (isDownloadingUpdate) {
                                                isDownloadingUpdate = false
                                                Toast.makeText(this@MainActivity, "Update download timed out", Toast.LENGTH_SHORT).show()
                                            }
                                        }

                                        AppUpdater.startDownloadAndInstall(this@MainActivity, info) { result ->
                                            watchdogJob.cancel()
                                            runOnUiThread {
                                                isDownloadingUpdate = false
                                                when (result) {
                                                    UpdateResult.SUCCESS -> {}
                                                    UpdateResult.BROWSER_OPENED -> {
                                                        Toast.makeText(this@MainActivity, "Opening update in browser...", Toast.LENGTH_SHORT).show()
                                                    }
                                                    UpdateResult.FAILED -> {
                                                        Toast.makeText(this@MainActivity, "Update download was cancelled or failed", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                onLogout = {
                                    PreferenceManager.clearSession(this@MainActivity)
                                    isLoggedIn.value = false
                                }
                            )
                        } else {
                            AuthScreen(
                                availableUpdate = availableUpdate,
                                isDownloadingUpdate = isDownloadingUpdate,
                                onUpdateClick = {
                                    availableUpdate?.let { info ->
                                        isDownloadingUpdate = true
                                        Toast.makeText(this@MainActivity, "Starting update download...", Toast.LENGTH_SHORT).show()

                                        val watchdogJob = lifecycleScope.launch {
                                            kotlinx.coroutines.delay(600_000L)
                                            if (isDownloadingUpdate) {
                                                isDownloadingUpdate = false
                                                Toast.makeText(this@MainActivity, "Update download timed out", Toast.LENGTH_SHORT).show()
                                            }
                                        }

                                        AppUpdater.startDownloadAndInstall(this@MainActivity, info) { result ->
                                            watchdogJob.cancel()
                                            runOnUiThread {
                                                isDownloadingUpdate = false
                                                when (result) {
                                                    UpdateResult.SUCCESS -> {}
                                                    UpdateResult.BROWSER_OPENED -> {
                                                        Toast.makeText(this@MainActivity, "Opening update in browser...", Toast.LENGTH_SHORT).show()
                                                    }
                                                    UpdateResult.FAILED -> {
                                                        Toast.makeText(this@MainActivity, "Update download was cancelled or failed", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                onAuthSuccess = { email ->
                                    userEmail = email
                                    isLoggedIn.value = true
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
    }

    override fun onResume() {
        super.onResume()
        if (isFirstResume) {
            isFirstResume = false
            return
        }
        if (PreferenceManager.isLoggedIn(this)) {
            lifecycleScope.launch(Dispatchers.IO) {
                val isStillRegistered = checkDeviceRegistration()
                if (!isStillRegistered) {
                    withContext(Dispatchers.Main) {
                        PreferenceManager.clearSession(this@MainActivity)
                        isLoggedInState?.value = false
                        Toast.makeText(this@MainActivity, "Device removed from dashboard. Signed out.", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private suspend fun checkDeviceRegistration(): Boolean {
        val token = PreferenceManager.getAccessToken(this) ?: return false
        val userId = PreferenceManager.getUserId(this) ?: return false
        val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"
        return try {
            val response = httpClient.get("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                header("Authorization", "Bearer $token")
                url {
                    parameters.append("user_id", "eq.$userId")
                    parameters.append("device_name", "eq.$deviceName")
                    parameters.append("select", "id")
                }
            }
            if (response.status.value in 200..299) {
                val body = response.bodyAsText().trim()
                if (body != "[]") {
                    PreferenceManager.setDeviceRegistered(this, true)
                    true
                } else {
                    // Only treat empty array as removed if previously registered
                    if (PreferenceManager.isDeviceRegistered(this)) {
                        false
                    } else {
                        true
                    }
                }
            } else {
                // Network error or 401: don't boot user immediately on flaky network
                true
            }
        } catch (e: Exception) {
            true
        }
    }

    @Composable
    fun AuthScreen(
        availableUpdate: AppVersionInfo? = null,
        isDownloadingUpdate: Boolean = false,
        onUpdateClick: () -> Unit = {},
        onAuthSuccess: (String) -> Unit
    ) {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        var showPassword by remember { mutableStateOf(false) }
        var isSignUp by remember { mutableStateOf(false) }
        var isLoading by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 28.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Watch Later",
                fontSize = 34.sp,
                fontWeight = FontWeight.ExtraBold,
                color = PureWhite,
                letterSpacing = (-0.5).sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Never lose a reel worth revisiting.",
                fontSize = 14.sp,
                color = DarkMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = if (availableUpdate != null) 16.dp else 36.dp)
            )

            // In-app Update Banner (Visible even before login)
            if (availableUpdate != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp)
                        .border(1.dp, Color(0xFF225544), RoundedCornerShape(16.dp))
                        .background(Color(0xFF0D221A), RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Text(
                        text = "NEW UPDATE AVAILABLE: v${availableUpdate.versionName}",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF34D399),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = availableUpdate.releaseNotes ?: "Bug fixes and performance improvements.",
                        fontSize = 13.sp,
                        color = LightText
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = onUpdateClick,
                        enabled = !isDownloadingUpdate,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF10B981),
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(40.dp)
                    ) {
                        if (isDownloadingUpdate) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = Color.Black
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Downloading update...", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        } else {
                            Text("Update Now (v${availableUpdate.versionName})", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Input card with dark styling
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .background(DarkSurface, RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; errorMessage = null },
                    label = { Text("Email", color = DarkMuted) },
                    singleLine = true,
                    trailingIcon = {
                        if (email.isNotEmpty()) {
                            IconButton(
                                onClick = { email = "" },
                                modifier = Modifier.semantics { contentDescription = "Clear email" }
                            ) {
                                Text(
                                    text = "✕",
                                    color = DarkMuted,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = PureWhite,
                        unfocusedTextColor = LightText,
                        focusedBorderColor = PureWhite,
                        unfocusedBorderColor = DarkBorder,
                        focusedContainerColor = DarkBg,
                        unfocusedContainerColor = DarkBg
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; errorMessage = null },
                    label = { Text("Password", color = DarkMuted) },
                    singleLine = true,
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(end = 4.dp)
                        ) {
                            if (password.isNotEmpty()) {
                                IconButton(
                                    onClick = { password = "" },
                                    modifier = Modifier.semantics { contentDescription = "Clear password" }
                                ) {
                                    Text(
                                        text = "✕",
                                        color = DarkMuted,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Text(
                                    text = if (showPassword) "Hide" else "Show",
                                    color = LightText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = PureWhite,
                        unfocusedTextColor = LightText,
                        focusedBorderColor = PureWhite,
                        unfocusedBorderColor = DarkBorder,
                        focusedContainerColor = DarkBg,
                        unfocusedContainerColor = DarkBg
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                AnimatedVisibility(
                    visible = errorMessage != null,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    errorMessage?.let {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = it,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        val submittedEmail = email.trim()
                        val submittedPassword = password
                        if (submittedEmail.isBlank() || submittedPassword.isBlank()) {
                            errorMessage = "Please enter both email and password"
                            return@Button
                        }
                        isLoading = true
                        lifecycleScope.launch(Dispatchers.IO) {
                            try {
                                val endpoint = if (isSignUp) "signup" else "token?grant_type=password"
                                val payload = buildJsonObject {
                                    put("email", submittedEmail)
                                    put("password", submittedPassword)
                                }.toString()

                                val response = httpClient.post("${BuildConfig.SUPABASE_URL}/auth/v1/$endpoint") {
                                    header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                    contentType(ContentType.Application.Json)
                                    setBody(payload)
                                }

                                val responseText = response.bodyAsText()
                                if (response.status.isSuccess()) {
                                    val json = Json.parseToJsonElement(responseText).jsonObject
                                    val session = json["session"]?.jsonObject ?: json
                                    val accessToken = session["access_token"]?.jsonPrimitive?.content
                                    val refreshToken = session["refresh_token"]?.jsonPrimitive?.content
                                    val user = session["user"]?.jsonObject ?: json["user"]?.jsonObject
                                    val userId = user?.get("id")?.jsonPrimitive?.content ?: ""

                                    if (accessToken != null && refreshToken != null) {
                                        val registered = registerDevice(accessToken, userId)
                                        withContext(Dispatchers.Main) {
                                            isLoading = false
                                            if (registered) {
                                                PreferenceManager.saveSession(
                                                    this@MainActivity,
                                                    userId = userId,
                                                    email = submittedEmail,
                                                    accessToken = accessToken,
                                                    refreshToken = refreshToken
                                                )
                                                onAuthSuccess(submittedEmail)
                                            } else {
                                                errorMessage = "Device registration failed. Please try again."
                                            }
                                        }
                                    } else {
                                        withContext(Dispatchers.Main) {
                                            isLoading = false
                                            if (isSignUp) {
                                                errorMessage = "Sign up successful! Please check your email to confirm, then sign in."
                                                isSignUp = false
                                            } else {
                                                errorMessage = "Session tokens missing in response."
                                            }
                                        }
                                    }
                                } else {
                                    val parsedErr = runCatching {
                                        Json.parseToJsonElement(responseText).jsonObject["msg"]?.jsonPrimitive?.content
                                            ?: Json.parseToJsonElement(responseText).jsonObject["error_description"]?.jsonPrimitive?.content
                                    }.getOrNull()
                                    withContext(Dispatchers.Main) {
                                        isLoading = false
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
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PureWhite,
                        contentColor = DarkBg,
                        disabledContainerColor = DarkBorder,
                        disabledContentColor = DarkMuted
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = DarkBg
                        )
                    } else {
                        Text(
                            text = if (isSignUp) "Sign Up" else "Sign In",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            TextButton(
                onClick = { isSignUp = !isSignUp; errorMessage = null }
            ) {
                Text(
                    text = if (isSignUp) "Already have an account? Sign In" else "Don't have an account? Sign Up",
                    color = LightText,
                    fontSize = 13.sp
                )
            }
        }
    }

    @Composable
    fun SettingsScreen(
        email: String,
        availableUpdate: AppVersionInfo? = null,
        isDownloadingUpdate: Boolean = false,
        onUpdateClick: () -> Unit = {},
        onLogout: () -> Unit
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Watch Later",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = PureWhite,
                letterSpacing = (-0.5).sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Instant silent capture is active on this device.",
                fontSize = 14.sp,
                color = DarkMuted,
                textAlign = TextAlign.Center
            )

            // In-app Update Banner
            if (availableUpdate != null) {
                Spacer(modifier = Modifier.height(20.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, Color(0xFF225544), RoundedCornerShape(16.dp))
                        .background(Color(0xFF0D221A), RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Text(
                        text = "NEW UPDATE AVAILABLE: v${availableUpdate.versionName}",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF34D399),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = availableUpdate.releaseNotes ?: "Bug fixes and performance improvements.",
                        fontSize = 13.sp,
                        color = LightText
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = onUpdateClick,
                        enabled = !isDownloadingUpdate,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF10B981),
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(40.dp)
                    ) {
                        if (isDownloadingUpdate) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = Color.Black
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Downloading update...", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        } else {
                            Text("Update Now (v${availableUpdate.versionName})", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, DarkBorder, RoundedCornerShape(16.dp))
                    .background(DarkSurface, RoundedCornerShape(16.dp))
                    .padding(20.dp)
            ) {
                Text(
                    text = "AUTHENTICATED ACCOUNT",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = DarkMuted,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = email,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = LightText
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "DEVICE NAME",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    color = DarkMuted,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "${Build.MANUFACTURER} ${Build.MODEL}",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    color = LightText
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF221111),
                    contentColor = MaterialTheme.colorScheme.error
                ),
                shape = RoundedCornerShape(10.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF442222)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Text(
                    text = "Disconnect Device",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
            }
        }
    }

    private suspend fun registerDevice(token: String, userId: String): Boolean {
        return try {
            val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"
            // Upsert / check existing device to avoid duplicates using query parameters
            val checkResponse = httpClient.get("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                header("Authorization", "Bearer $token")
                url {
                    parameters.append("user_id", "eq.$userId")
                    parameters.append("device_name", "eq.$deviceName")
                    parameters.append("select", "id")
                }
            }
            if (checkResponse.status.value in 200..299) {
                val existingBody = checkResponse.bodyAsText()
                if (existingBody.contains("\"id\"")) {
                    PreferenceManager.setDeviceRegistered(this, true)
                    return true
                }
            } else {
                return false
            }

            val devicePayload = buildJsonObject {
                put("user_id", userId)
                put("platform", "android")
                put("device_name", deviceName)
            }.toString()

            val insertResponse = httpClient.post("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                header("Authorization", "Bearer $token")
                contentType(ContentType.Application.Json)
                setBody(devicePayload)
            }
            val success = insertResponse.status.value in 200..299
            if (success) {
                PreferenceManager.setDeviceRegistered(this, true)
            }
            success
        } catch (e: Exception) {
            false
        }
    }
}
