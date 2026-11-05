package com.reelvault.app.util

import java.net.URI

object UrlHelper {
    private val INSTAGRAM_REEL_PATTERN = Regex(
        """https?://(?:www\.)?instagram\.com/(?:reel|reels|p)/([A-Za-z0-9_-]+)""",
        RegexOption.IGNORE_CASE
    )

    fun extractAndNormalizeReelUrl(sharedText: String?): String? {
        if (sharedText.isNullOrBlank()) return null
        val match = INSTAGRAM_REEL_PATTERN.find(sharedText) ?: return null
        val shortcode = match.groupValues[1]
        // Standardize cleanly to canonical Reel URL without tracking queries
        return "https://www.instagram.com/reel/$shortcode/"
    }
}

