package com.reelvault.app.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

// Watch Later Design System Palette:
// #0B0B0B · #1A1A1A · #333333 · #6B6B6B · #D9D9D9 · #FFFFFF
val DarkBg = Color(0xFF0B0B0B)
val DarkSurface = Color(0xFF1A1A1A)
val DarkBorder = Color(0xFF333333)
val DarkMuted = Color(0xFF6B6B6B)
val LightText = Color(0xFFD9D9D9)
val PureWhite = Color(0xFFFFFFFF)
val AccentRed = Color(0xFFEF4444)

val WatchLaterDarkColorScheme = darkColorScheme(
    primary = PureWhite,
    onPrimary = DarkBg,
    primaryContainer = DarkSurface,
    onPrimaryContainer = LightText,
    secondary = LightText,
    onSecondary = DarkBg,
    background = DarkBg,
    onBackground = LightText,
    surface = DarkSurface,
    onSurface = LightText,
    surfaceVariant = DarkSurface,
    onSurfaceVariant = LightText,
    outline = DarkBorder,
    error = AccentRed,
    onError = PureWhite
)
