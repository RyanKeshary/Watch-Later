package com.reelvault.app.util

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AppUpdaterTest {

    @Test
    fun testVersionJsonDeserialization() {
        val jsonPayload = """
            {
              "versionCode": 2,
              "versionName": "1.0.1",
              "apkUrl": "https://watchlatertool.vercel.app/watch-later.apk",
              "releaseNotes": "Performance update"
            }
        """.trimIndent()

        val json = Json { ignoreUnknownKeys = true }
        val info = json.decodeFromString<AppVersionInfo>(jsonPayload)

        assertNotNull(info)
        assertEquals(2, info.versionCode)
        assertEquals("1.0.1", info.versionName)
        assertEquals("https://watchlatertool.vercel.app/watch-later.apk", info.apkUrl)
        assertTrue(info.versionCode > 1)
    }
}
