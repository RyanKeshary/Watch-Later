package com.reelvault.app.ui

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PointMode
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
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
import com.reelvault.app.util.InstallResult
import com.reelvault.app.util.PreferenceManager
import com.reelvault.app.util.UpdateResult
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.request
import io.ktor.client.request.url
import io.ktor.client.statement.HttpResponse
import io.ktor.http.HttpMethod
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.patch
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
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

data class RemoteReelItem(
    val id: String,
    val url: String,
    val title: String,
    val creator: String,
    val categoryName: String,
    val completionStatus: String,
    val processingStatus: String
)

class MainActivity : ComponentActivity() {

    companion object {
        private var hasShownPermissionToast = false
    }

    private val httpClient = HttpClient(Android)
    private var isFirstResume = true
    private var isLoggedInState: MutableState<Boolean>? = null

    private suspend fun executeAuthenticatedRequest(
        block: HttpRequestBuilder.(token: String) -> Unit
    ): HttpResponse? {
        var token = PreferenceManager.getAccessToken(this@MainActivity) ?: return null
        var res = httpClient.request {
            header("apikey", BuildConfig.SUPABASE_ANON_KEY)
            header("Authorization", "Bearer $token")
            block(token)
        }
        if (res.status.value == 401) {
            val refreshed = PreferenceManager.refreshSession(this@MainActivity, httpClient)
            if (refreshed != null) {
                token = refreshed
                res = httpClient.request {
                    header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                    header("Authorization", "Bearer $token")
                    block(token)
                }
            }
        }
        return res
    }

    private fun parseReel(el: kotlinx.serialization.json.JsonElement, catMap: Map<String, String>): RemoteReelItem? {
        val obj = el.jsonObject
        val id = obj["id"]?.jsonPrimitive?.content ?: return null
        val url = obj["url"]?.jsonPrimitive?.contentOrNull ?: ""
        val title = obj["ai_title"]?.jsonPrimitive?.contentOrNull ?: "Saved Reel"
        val creator = obj["creator_username"]?.jsonPrimitive?.contentOrNull ?: ""
        val catId = obj["category_id"]?.jsonPrimitive?.contentOrNull
        val catName = if (catId == null) "Inbox" else (catMap[catId] ?: "Categorized")
        val compStatus = obj["completion_status"]?.jsonPrimitive?.contentOrNull ?: "pending"
        val procStatus = obj["processing_status"]?.jsonPrimitive?.contentOrNull ?: "processed"
        return RemoteReelItem(id, url, title, creator, catName, compStatus, procStatus)
    }

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
                                withContext(Dispatchers.IO) {
                                    // 1. Verify remote device registration in Supabase
                                    val isStillRegistered = checkDeviceRegistration()
                                    if (!isStillRegistered) {
                                        withContext(Dispatchers.Main) {
                                            PreferenceManager.clearSession(this@MainActivity)
                                            isLoggedIn.value = false
                                            Toast.makeText(this@MainActivity, "Device removed from dashboard. Signed out.", Toast.LENGTH_LONG).show()
                                        }
                                        return@withContext
                                    }

                                    // 2. Trigger sync of any pending reels
                                    val db = AppDatabase.getDatabase(applicationContext)
                                    db.reelDao().markPendingAuthAsPendingSync()
                                    ReelSyncWorker.enqueue(applicationContext)

                                    // 3. Periodic low-overhead check (every 30s) while app is open in foreground
                                    while (PreferenceManager.isLoggedIn(this@MainActivity)) {
                                        kotlinx.coroutines.delay(30_000L)
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
                                                    UpdateResult.PERMISSION_REQUIRED -> {
                                                        Toast.makeText(this@MainActivity, "Allow installation from this source, then return to complete update.", Toast.LENGTH_LONG).show()
                                                    }
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
                                                    UpdateResult.PERMISSION_REQUIRED -> {
                                                        Toast.makeText(this@MainActivity, "Allow installation from this source, then return to complete update.", Toast.LENGTH_LONG).show()
                                                    }
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
        lifecycleScope.launch {
            val result = AppUpdater.checkAndInstallPending(this@MainActivity)
            when (result) {
                InstallResult.PERMISSION_REQUIRED -> {
                    if (!hasShownPermissionToast) {
                        hasShownPermissionToast = true
                        Toast.makeText(this@MainActivity, "Allow installation from this source, then return to complete update.", Toast.LENGTH_LONG).show()
                    }
                }
                InstallResult.FAILED -> {
                    Toast.makeText(this@MainActivity, "Failed to install pending update", Toast.LENGTH_SHORT).show()
                }
                InstallResult.SUCCESS, InstallResult.NO_PENDING -> {}
            }
        }
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

    private fun showSyncNotification(deviceName: String) {
        val channelId = "watchlater_dashboard_sync"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Dashboard Sync",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications when device is synchronized with dashboard"
            }
            manager.createNotificationChannel(channel)
        }

        val notif = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle("Device Synchronized")
            .setContentText("$deviceName is synced with Watch Later dashboard.")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()

        manager.notify(2001, notif)
    }

    private suspend fun checkDeviceRegistration(): Boolean {
        val token = PreferenceManager.getAccessToken(this) ?: return false
        val userId = PreferenceManager.getUserId(this) ?: return false
        val deviceName = PreferenceManager.getDeviceName()
        val sanitizedName = PreferenceManager.sanitizeForLike(deviceName)
        return try {
            val response = httpClient.get("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                header("Authorization", "Bearer $token")
                url {
                    parameters.append("user_id", "eq.$userId")
                    parameters.append("device_name", "like.$sanitizedName*")
                    parameters.append("select", "id,device_name,last_synced_at")
                }
            }
            if (response.status.value in 200..299) {
                val body = response.bodyAsText().trim()
                val parsedArray = runCatching { Json.parseToJsonElement(body).jsonArray }.getOrNull()
                if (parsedArray != null) {
                    val matchingDevice = parsedArray.mapNotNull { it.jsonObject }.firstOrNull { obj ->
                        val rawName = obj["device_name"]?.jsonPrimitive?.content ?: ""
                        PreferenceManager.isDeviceNameMatch(rawName, deviceName)
                    }
                    if (matchingDevice != null) {
                        PreferenceManager.setDeviceRegistered(this, true)
                        val devId = matchingDevice["id"]?.jsonPrimitive?.content
                        val lastSynced = matchingDevice["last_synced_at"]?.jsonPrimitive?.content
                        if (lastSynced != null) {
                            val saved = PreferenceManager.getLastSyncTimestamp(this@MainActivity)
                            if (saved == null) {
                                PreferenceManager.setLastSyncTimestamp(this@MainActivity, lastSynced)
                            } else if (saved != lastSynced) {
                                withContext(Dispatchers.Main) {
                                    showSyncNotification(deviceName)
                                    Toast.makeText(this@MainActivity, "Device synced with dashboard!", Toast.LENGTH_SHORT).show()
                                }
                                if (devId != null) {
                                    val ackName = "$deviceName [synced:$lastSynced]"
                                    val patchRes = runCatching {
                                        httpClient.patch("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                                            header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                                            header("Authorization", "Bearer $token")
                                            contentType(ContentType.Application.Json)
                                            url {
                                                parameters.append("id", "eq.$devId")
                                            }
                                            setBody(buildJsonObject {
                                                put("device_name", ackName)
                                            }.toString())
                                        }
                                    }.getOrNull()

                                    if (patchRes != null && patchRes.status.value in 200..299) {
                                        PreferenceManager.setLastSyncTimestamp(this@MainActivity, lastSynced)
                                    }
                                } else {
                                    PreferenceManager.setLastSyncTimestamp(this@MainActivity, lastSynced)
                                }
                            }
                        }
                        true
                    } else {
                        // Valid array returned but device not found
                        if (PreferenceManager.isDeviceRegistered(this)) {
                            false
                        } else {
                            true
                        }
                    }
                } else {
                    true
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
        var activeTab by rememberSaveable { mutableStateOf("dashboard") } // "dashboard" | "settings"
        var reelsList by remember { mutableStateOf<List<RemoteReelItem>>(emptyList()) }
        var pendingCount by remember { mutableStateOf(0) }
        var isFetching by remember { mutableStateOf(false) }
        var reloadRequested by remember { mutableStateOf(false) }
        var fetchError by remember { mutableStateOf<String?>(null) }
        var selectedCategory by rememberSaveable { mutableStateOf("All") }
        var searchQuery by rememberSaveable { mutableStateOf("") }
        var statusFilter by rememberSaveable { mutableStateOf("all") } // "all" | "pending" | "completed"
        var categoryMap by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
        var reelToDelete by remember { mutableStateOf<RemoteReelItem?>(null) }
        var inFlightUpdates by remember { mutableStateOf<Set<String>>(emptySet()) }
        var hasMoreReels by remember { mutableStateOf(false) }
        var isLoadingMore by remember { mutableStateOf(false) }
        var fetchGeneration by remember { mutableStateOf(0) }
        var serverOffset by remember { mutableStateOf(0) }

        var loadReelsRef: (() -> Unit)? = null

        val executeFetch: () -> Unit = {
            isFetching = true
            fetchError = null
            val currentGen = fetchGeneration + 1
            fetchGeneration = currentGen
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    var token = PreferenceManager.getAccessToken(this@MainActivity)
                    val userId = PreferenceManager.getUserId(this@MainActivity)
                    if (token == null || userId == null) {
                        return@launch
                    }

                    val db = AppDatabase.getDatabase(applicationContext)
                    val localPending = db.reelDao().getPendingCount()
                    withContext(Dispatchers.Main) {
                        pendingCount = localPending
                    }

                    // Fetch user categories map
                    val catRes = executeAuthenticatedRequest {
                        method = HttpMethod.Get
                        url("${BuildConfig.SUPABASE_URL}/rest/v1/categories")
                        url.parameters.append("user_id", "eq.$userId")
                        url.parameters.append("select", "id,name")
                    }

                    val activeCatMap = categoryMap.toMutableMap()
                    if (catRes != null && catRes.status.isSuccess()) {
                        val catJson = Json.parseToJsonElement(catRes.bodyAsText()).jsonArray
                        for (catEl in catJson) {
                            val cObj = catEl.jsonObject
                            val cId = cObj["id"]?.jsonPrimitive?.contentOrNull ?: ""
                            val cName = cObj["name"]?.jsonPrimitive?.contentOrNull ?: ""
                            if (cId.isNotEmpty()) activeCatMap[cId] = cName
                        }
                        withContext(Dispatchers.Main) {
                            categoryMap = activeCatMap
                        }
                    }

                    // Fetch reels
                    val res = executeAuthenticatedRequest {
                        method = HttpMethod.Get
                        url("${BuildConfig.SUPABASE_URL}/rest/v1/reels")
                        url.parameters.append("user_id", "eq.$userId")
                        url.parameters.append("select", "id,url,ai_title,creator_username,category_id,completion_status,processing_status")
                        url.parameters.append("order", "created_at.desc")
                        url.parameters.append("limit", "100")
                    }

                    if (res != null && res.status.isSuccess()) {
                        val json = Json.parseToJsonElement(res.bodyAsText()).jsonArray
                        val items = json.mapNotNull { parseReel(it, activeCatMap) }
                        withContext(Dispatchers.Main) {
                            if (inFlightUpdates.isNotEmpty()) {
                                reloadRequested = true
                            } else if (fetchGeneration == currentGen) {
                                reelsList = items
                                serverOffset = items.size
                                hasMoreReels = items.size >= 100
                            }
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            fetchError = "Could not load reels (${res?.status?.value ?: "unauthorized"})"
                        }
                    }
                    } catch (e: Exception) {
                        withContext(Dispatchers.Main) {
                            fetchError = "Connection error: ${e.message}"
                        }
                    } finally {
                        withContext(Dispatchers.Main) {
                            isFetching = false
                            if (reloadRequested) {
                                reloadRequested = false
                                loadReelsRef?.invoke()
                            }
                        }
                    }
                }
            }

        val loadReels: () -> Unit = {
            if (isFetching || inFlightUpdates.isNotEmpty()) {
                reloadRequested = true
            } else {
                executeFetch()
            }
        }
        loadReelsRef = loadReels

        LaunchedEffect(Unit) {
            loadReels()
        }

        val loadMoreReels: () -> Unit = {
            if (!isFetching && !isLoadingMore && hasMoreReels) {
                isLoadingMore = true
                val requestGen = fetchGeneration
                lifecycleScope.launch(Dispatchers.IO) {
                    try {
                        val userId = PreferenceManager.getUserId(this@MainActivity)
                        if (userId != null) {
                            val offset = serverOffset
                            val moreRes = executeAuthenticatedRequest {
                                method = HttpMethod.Get
                                url("${BuildConfig.SUPABASE_URL}/rest/v1/reels")
                                url.parameters.append("user_id", "eq.$userId")
                                url.parameters.append("select", "id,url,ai_title,creator_username,category_id,completion_status,processing_status")
                                url.parameters.append("order", "created_at.desc")
                                url.parameters.append("offset", "$offset")
                                url.parameters.append("limit", "100")
                            }
                            if (moreRes != null && moreRes.status.isSuccess()) {
                                val json = Json.parseToJsonElement(moreRes.bodyAsText()).jsonArray
                                val newItems = json.mapNotNull { parseReel(it, categoryMap) }
                                withContext(Dispatchers.Main) {
                                    if (fetchGeneration == requestGen) {
                                        val existingIds = reelsList.map { it.id }.toSet()
                                        val distinctNew = newItems.filter { it.id !in existingIds }
                                        reelsList = reelsList + distinctNew
                                        serverOffset += json.size
                                        hasMoreReels = json.size >= 100
                                    }
                                }
                            } else {
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(this@MainActivity, "Failed to load more reels (${moreRes?.status?.value ?: "unauthorized"})", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    } catch (e: Exception) {
                        withContext(Dispatchers.Main) {
                            Toast.makeText(this@MainActivity, "Error loading more reels: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    } finally {
                        withContext(Dispatchers.Main) {
                            isLoadingMore = false
                        }
                    }
                }
            }
        }

        val toggleWatched: (RemoteReelItem) -> Unit = { item ->
            if (item.id !in inFlightUpdates) {
                inFlightUpdates = inFlightUpdates + item.id
                fetchGeneration += 1
                if (isFetching) {
                    reloadRequested = true
                }
                val oldStatus = item.completionStatus
                val newStatus = if (oldStatus == "completed" || oldStatus == "watched") "pending" else "completed"
                reelsList = reelsList.map { if (it.id == item.id) it.copy(completionStatus = newStatus) else it }
                lifecycleScope.launch(Dispatchers.IO) {
                    var success = false
                    try {
                        val patchRes = executeAuthenticatedRequest {
                            method = HttpMethod.Patch
                            contentType(ContentType.Application.Json)
                            url("${BuildConfig.SUPABASE_URL}/rest/v1/reels")
                            url.parameters.append("id", "eq.${item.id}")
                            setBody(buildJsonObject {
                                put("completion_status", newStatus)
                            }.toString())
                        }
                        success = patchRes?.status?.isSuccess() == true
                    } catch (_: Exception) {
                        success = false
                    } finally {
                        withContext(Dispatchers.Main) {
                            inFlightUpdates = inFlightUpdates - item.id
                            if (!success) {
                                reelsList = reelsList.map { if (it.id == item.id) it.copy(completionStatus = oldStatus) else it }
                                Toast.makeText(this@MainActivity, "Failed to update status", Toast.LENGTH_SHORT).show()
                            }
                            if (inFlightUpdates.isEmpty() && reloadRequested && !isFetching) {
                                reloadRequested = false
                                loadReelsRef?.invoke()
                            }
                        }
                    }
                }
            }
        }

        val deleteReel: (RemoteReelItem) -> Unit = { item ->
            if (item.id !in inFlightUpdates) {
                val originalIndex = reelsList.indexOfFirst { it.id == item.id }
                if (originalIndex != -1) {
                    inFlightUpdates = inFlightUpdates + item.id
                    fetchGeneration += 1
                    if (isFetching) {
                        reloadRequested = true
                    }
                    reelsList = reelsList.filter { it.id != item.id }
                    serverOffset = (serverOffset - 1).coerceAtLeast(0)
                    lifecycleScope.launch(Dispatchers.IO) {
                        var success = false
                        try {
                            val delRes = executeAuthenticatedRequest {
                                method = HttpMethod.Delete
                                url("${BuildConfig.SUPABASE_URL}/rest/v1/reels")
                                url.parameters.append("id", "eq.${item.id}")
                            }
                            success = delRes?.status?.isSuccess() == true
                        } catch (_: Exception) {
                            success = false
                        } finally {
                            withContext(Dispatchers.Main) {
                                inFlightUpdates = inFlightUpdates - item.id
                                if (!success) {
                                    if (reelsList.none { it.id == item.id }) {
                                        reelsList = if (originalIndex in 0..reelsList.size) {
                                            reelsList.toMutableList().apply { add(originalIndex, item) }
                                        } else {
                                            reelsList + item
                                        }
                                    }
                                    serverOffset += 1
                                    Toast.makeText(this@MainActivity, "Failed to delete reel", Toast.LENGTH_SHORT).show()
                                }
                                if (inFlightUpdates.isEmpty() && reloadRequested && !isFetching) {
                                    reloadRequested = false
                                    loadReelsRef?.invoke()
                                }
                            }
                        }
                    }
                }
            }
        }

        val categories = remember(reelsList) {
            listOf("All") + reelsList.map { it.categoryName }.distinct().filter { it.isNotBlank() }
        }

        LaunchedEffect(categories) {
            if (reelsList.isNotEmpty() && selectedCategory !in categories) {
                selectedCategory = "All"
            }
        }

        val filteredReels = remember(reelsList, selectedCategory, searchQuery, statusFilter) {
            reelsList.filter { item ->
                val matchesCat = selectedCategory == "All" || selectedCategory !in categories || item.categoryName == selectedCategory
                val matchesStatus = when (statusFilter) {
                    "pending" -> item.completionStatus != "completed" && item.completionStatus != "watched"
                    "completed" -> item.completionStatus == "completed" || item.completionStatus == "watched"
                    else -> true
                }
                val matchesSearch = if (searchQuery.isBlank()) true else {
                    val query = searchQuery.trim().lowercase()
                    item.title.lowercase().contains(query) ||
                    item.creator.lowercase().contains(query) ||
                    item.categoryName.lowercase().contains(query)
                }
                matchesCat && matchesStatus && matchesSearch
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 20.dp)
        ) {
            // App Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Watch Later",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = PureWhite,
                        letterSpacing = (-0.5).sp
                    )
                    Text(
                        text = if (pendingCount > 0) "$pendingCount pending sync" else "Vault Synced",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = if (pendingCount > 0) Color(0xFFFBBF24) else Color(0xFF34D399)
                    )
                }

                // Top Segmented Tab Switcher (Dashboard vs Settings)
                Row(
                    modifier = Modifier
                        .background(DarkSurface, RoundedCornerShape(20.dp))
                        .border(1.dp, DarkBorder, RoundedCornerShape(20.dp))
                        .padding(3.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clickable { activeTab = "dashboard" }
                            .background(
                                if (activeTab == "dashboard") PureWhite else Color.Transparent,
                                RoundedCornerShape(16.dp)
                            )
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Vault",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (activeTab == "dashboard") DarkBg else LightText
                        )
                    }
                    Box(
                        modifier = Modifier
                            .clickable { activeTab = "settings" }
                            .background(
                                if (activeTab == "settings") PureWhite else Color.Transparent,
                                RoundedCornerShape(16.dp)
                            )
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Device",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (activeTab == "settings") DarkBg else LightText
                        )
                    }
                }
            }

            // In-app Update Banner (if available)
            if (availableUpdate != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .border(1.dp, Color(0xFF225544), RoundedCornerShape(12.dp))
                        .background(Color(0xFF0D221A), RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = "UPDATE AVAILABLE: v${availableUpdate.versionName}",
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF34D399),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = availableUpdate.releaseNotes ?: "Performance improvements.",
                        fontSize = 12.sp,
                        color = LightText
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = onUpdateClick,
                        enabled = !isDownloadingUpdate,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF10B981),
                            contentColor = Color.Black
                        ),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.fillMaxWidth().height(36.dp)
                    ) {
                        if (isDownloadingUpdate) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(14.dp),
                                strokeWidth = 2.dp,
                                color = Color.Black
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Downloading...", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        } else {
                            Text("Install v${availableUpdate.versionName}", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            if (activeTab == "dashboard") {
                // Search Input Box
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search reels, creators, topics...", color = DarkMuted, fontSize = 12.sp) },
                    singleLine = true,
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(
                                onClick = { searchQuery = "" },
                                modifier = Modifier.semantics { contentDescription = "Clear search" }
                            ) {
                                Text("✕", color = DarkMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    },
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = PureWhite,
                        unfocusedTextColor = LightText,
                        focusedBorderColor = PureWhite,
                        unfocusedBorderColor = DarkBorder,
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                        .defaultMinSize(minHeight = 48.dp)
                )

                // Status Tabs (All / To Watch / Watched)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val statusTabs = listOf(
                        "all" to "All",
                        "pending" to "To Watch",
                        "completed" to "Watched"
                    )
                    statusTabs.forEach { (statusKey, label) ->
                        val isSelected = statusFilter == statusKey
                        Box(
                            modifier = Modifier
                                .clickable(
                                    role = Role.Tab,
                                    onClick = { statusFilter = statusKey }
                                )
                                .semantics { selected = isSelected }
                                .background(
                                    if (isSelected) PureWhite else DarkSurface,
                                    RoundedCornerShape(8.dp)
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) PureWhite else DarkBorder,
                                    RoundedCornerShape(8.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) DarkBg else LightText
                            )
                        }
                    }
                }

                // Category Filter Pills (horizontally scrollable without limit)
                if (categories.size > 1) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(bottom = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        categories.forEach { cat ->
                            val isSelected = selectedCategory == cat
                            Box(
                                modifier = Modifier
                                    .clickable { selectedCategory = cat }
                                    .background(
                                        if (isSelected) PureWhite else DarkSurface,
                                        RoundedCornerShape(12.dp)
                                    )
                                    .border(
                                        1.dp,
                                        if (isSelected) PureWhite else DarkBorder,
                                        RoundedCornerShape(12.dp)
                                    )
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = cat,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) DarkBg else LightText
                                )
                            }
                        }
                    }
                }

                // Sync & Refresh Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "${filteredReels.size} reel${if (filteredReels.size == 1) "" else "s"}",
                            fontSize = 12.sp,
                            color = DarkMuted
                        )
                        if (isFetching && reelsList.isNotEmpty()) {
                            CircularProgressIndicator(
                                color = PureWhite,
                                strokeWidth = 1.5.dp,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(
                            onClick = {
                                lifecycleScope.launch(Dispatchers.IO) {
                                    val db = AppDatabase.getDatabase(applicationContext)
                                    db.reelDao().markPendingAuthAsPendingSync()
                                    ReelSyncWorker.syncNow(applicationContext)
                                    val loggedIn = PreferenceManager.isLoggedIn(this@MainActivity)
                                    withContext(Dispatchers.Main) {
                                        if (!loggedIn) {
                                            onLogout()
                                        } else {
                                            loadReels()
                                        }
                                    }
                                }
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(30.dp)
                        ) {
                            Text("Sync Queue", fontSize = 11.sp, color = PureWhite, fontWeight = FontWeight.SemiBold)
                        }

                        TextButton(
                            onClick = loadReels,
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(30.dp)
                        ) {
                            Text("Refresh", fontSize = 11.sp, color = LightText)
                        }
                    }
                }

                if (fetchError != null && reelsList.isNotEmpty()) {
                    Text(
                        text = fetchError ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }

                if (isFetching && reelsList.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = PureWhite, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                    }
                } else if (fetchError != null && reelsList.isEmpty()) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(text = fetchError ?: "", color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = loadReels) { Text("Retry") }
                    }
                } else if (filteredReels.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        if (reelsList.isNotEmpty()) {
                            Text(
                                text = "No matching reels",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Try adjusting your search query, status, or category filter.",
                                fontSize = 13.sp,
                                color = DarkMuted,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(14.dp))
                            Button(
                                onClick = {
                                    searchQuery = ""
                                    statusFilter = "all"
                                    selectedCategory = "All"
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = DarkSurface,
                                    contentColor = PureWhite
                                )
                            ) {
                                Text("Clear Filters", fontSize = 12.sp)
                            }
                            if (hasMoreReels) {
                                Spacer(modifier = Modifier.height(10.dp))
                                if (isLoadingMore) {
                                    CircularProgressIndicator(color = PureWhite, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                                } else {
                                    TextButton(onClick = loadMoreReels) {
                                        Text("Load More Reels", fontSize = 12.sp, color = PureWhite)
                                    }
                                }
                            }
                        } else {
                            Text(
                                text = "No saved reels found",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Share any Instagram Reel to Watch Later to capture it silently.",
                                fontSize = 13.sp,
                                color = DarkMuted,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(filteredReels, key = { it.id }) { item ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, DarkBorder, RoundedCornerShape(12.dp))
                                    .background(DarkSurface, RoundedCornerShape(12.dp))
                                    .clickable {
                                        if (item.url.isNotBlank()) {
                                            runCatching {
                                                val uri = Uri.parse(item.url)
                                                val scheme = uri.scheme?.lowercase()
                                                if (scheme == "http" || scheme == "https") {
                                                    val intent = Intent(Intent.ACTION_VIEW, uri)
                                                    startActivity(intent)
                                                }
                                            }
                                        }
                                    }
                                    .padding(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = item.categoryName.uppercase(),
                                        fontSize = 9.sp,
                                        fontFamily = FontFamily.Monospace,
                                        color = DarkMuted,
                                        letterSpacing = 1.sp
                                    )
                                    if (item.creator.isNotBlank()) {
                                        Text(
                                            text = "@${item.creator}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = PureWhite
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = item.title,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PureWhite,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Open on Instagram ↗",
                                        fontSize = 11.sp,
                                        color = LightText
                                    )

                                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                        val isCompleted = item.completionStatus == "completed" || item.completionStatus == "watched"
                                        val isUpdating = item.id in inFlightUpdates
                                        val toggleLabel = if (isCompleted) "Mark unwatched" else "Mark watched"
                                        Box(
                                            modifier = Modifier
                                                .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
                                                .then(
                                                    if (isUpdating) Modifier else Modifier.clickable(
                                                        role = Role.Button,
                                                        onClickLabel = "$toggleLabel ${item.title}"
                                                    ) { toggleWatched(item) }
                                                )
                                                .semantics { contentDescription = "$toggleLabel: ${item.title}" }
                                                .padding(horizontal = 8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = if (isCompleted) "Watched ✓" else "Mark Watched",
                                                fontSize = 11.sp,
                                                fontWeight = if (isCompleted) FontWeight.SemiBold else FontWeight.Normal,
                                                color = if (isUpdating) DarkMuted.copy(alpha = 0.5f) else if (isCompleted) Color(0xFF34D399) else DarkMuted
                                            )
                                        }

                                        Box(
                                            modifier = Modifier
                                                .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
                                                .then(
                                                    if (isUpdating) Modifier else Modifier.clickable(
                                                        role = Role.Button,
                                                        onClickLabel = "Delete ${item.title}"
                                                    ) { reelToDelete = item }
                                                )
                                                .semantics { contentDescription = "Delete reel: ${item.title}" }
                                                .padding(horizontal = 8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "Delete",
                                                fontSize = 11.sp,
                                                color = if (isUpdating) DarkMuted.copy(alpha = 0.5f) else Color(0xFFEF4444)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        if (hasMoreReels) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (isLoadingMore) {
                                        CircularProgressIndicator(color = PureWhite, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                                    } else {
                                        TextButton(onClick = loadMoreReels) {
                                            Text("Load More Reels", fontSize = 12.sp, color = PureWhite)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // Device / Account Settings View
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
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
                            text = PreferenceManager.getDeviceName(),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = LightText
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

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

            // Delete Confirmation Dialog
            reelToDelete?.let { item ->
                AlertDialog(
                    onDismissRequest = { reelToDelete = null },
                    containerColor = DarkSurface,
                    titleContentColor = PureWhite,
                    textContentColor = LightText,
                    title = { Text("Delete Reel?", fontWeight = FontWeight.Bold) },
                    text = { Text("Are you sure you want to delete \"${item.title}\"? This action cannot be undone.") },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                val toDelete = item
                                reelToDelete = null
                                deleteReel(toDelete)
                            }
                        ) {
                            Text("Delete", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { reelToDelete = null }) {
                            Text("Cancel", color = LightText)
                        }
                    }
                )
            }
        }
    }

    private suspend fun registerDevice(token: String, userId: String): Boolean {
        return try {
            val deviceName = PreferenceManager.getDeviceName()
            val sanitizedName = PreferenceManager.sanitizeForLike(deviceName)
            // Exact device query using like with exact wildcard suffix only for [synced:...]
            val checkResponse = httpClient.get("${BuildConfig.SUPABASE_URL}/rest/v1/devices") {
                header("apikey", BuildConfig.SUPABASE_ANON_KEY)
                header("Authorization", "Bearer $token")
                url {
                    parameters.append("user_id", "eq.$userId")
                    parameters.append("device_name", "like.$sanitizedName*")
                    parameters.append("select", "id,device_name")
                }
            }
            if (checkResponse.status.value in 200..299) {
                val existingBody = checkResponse.bodyAsText()
                val parsedArray = runCatching { Json.parseToJsonElement(existingBody).jsonArray }.getOrNull()
                val hasExactMatch = parsedArray?.any { element ->
                    val rawName = element.jsonObject["device_name"]?.jsonPrimitive?.content ?: ""
                    PreferenceManager.isDeviceNameMatch(rawName, deviceName)
                } ?: false
                if (hasExactMatch) {
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
