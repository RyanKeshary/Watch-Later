import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("org.jetbrains.kotlin.plugin.serialization")
}

val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) {
        FileInputStream(keystorePropsFile).use { load(it) }
    }
}

fun isSigningConfigured(config: com.android.build.api.dsl.SigningConfig?): Boolean {
    return config?.storeFile?.exists() == true &&
        !config.storePassword.isNullOrEmpty() &&
        !config.keyAlias.isNullOrEmpty() &&
        !config.keyPassword.isNullOrEmpty()
}

android {
    namespace = "com.reelvault.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.reelvault.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 8
        versionName = "1.0.7"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField("String", "SUPABASE_URL", "\"https://zxiddkgigvyejlcgahof.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"sb_publishable_mARgoU-fTj2mBnigw207rA_wu2kTMnS\"")
    }

    signingConfigs {
        create("release") {
            val keyPath = System.getenv("KEYSTORE_FILE")?.takeIf { it.isNotBlank() }
                ?: keystoreProps.getProperty("storeFile")?.takeIf { it.isNotBlank() }
                ?: "release.keystore"
            // Default release.keystore location resolves relative to the root project directory
            val resolvedFile = File(keyPath).let { f ->
                if (f.isAbsolute) f else rootProject.file(keyPath)
            }
            storeFile = resolvedFile
            storePassword = System.getenv("KEYSTORE_PASSWORD")?.takeIf { it.isNotBlank() }
                ?: keystoreProps.getProperty("storePassword")?.takeIf { it.isNotBlank() }
                ?: ""
            keyAlias = System.getenv("KEY_ALIAS")?.takeIf { it.isNotBlank() }
                ?: keystoreProps.getProperty("keyAlias")?.takeIf { it.isNotBlank() }
                ?: ""
            keyPassword = System.getenv("KEY_PASSWORD")?.takeIf { it.isNotBlank() }
                ?: keystoreProps.getProperty("keyPassword")?.takeIf { it.isNotBlank() }
                ?: ""
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
            enableV4Signing = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val relConfig = signingConfigs.getByName("release")
            if (isSigningConfigured(relConfig)) {
                signingConfig = relConfig
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Compose UI
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")

    // Room DB
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Security (EncryptedSharedPreferences)
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Supabase Kotlin SDK
    val supabaseVersion = "2.1.3"
    implementation("io.github.jan-tennert.supabase:postgrest-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:gotrue-kt:$supabaseVersion")
    implementation("io.ktor:ktor-client-android:2.3.8")

    // Serialization & Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
}

val checkReleaseSigning = tasks.register("checkReleaseSigning") {
    doLast {
        val relConfig = android.signingConfigs.findByName("release")
        val isConfigured = isSigningConfigured(relConfig)
        val allowUnsigned = (System.getenv("ALLOW_UNSIGNED_RELEASE")?.takeIf { it.isNotBlank() }
            ?: keystoreProps.getProperty("allowUnsignedRelease"))?.toBoolean() == true
        if (!isConfigured && !allowUnsigned) {
            throw GradleException("Release build requires valid signing credentials or ALLOW_UNSIGNED_RELEASE=true.")
        }
    }
}

tasks.matching { it.name in listOf("validateSigningRelease", "packageRelease", "packageReleaseBundle") }.configureEach {
    dependsOn(checkReleaseSigning)
}

