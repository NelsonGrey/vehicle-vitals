plugins {
    id("com.android.application")
    id("kotlin-android")
    id("com.google.gms.google-services")
    // id("com.google.firebase.appdistribution") // Removed - using Firebase CLI instead
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.nelsongrey.vehiclevitals.app.android"
    compileSdk = 36
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    defaultConfig {
        applicationId = "com.nelsongrey.vehiclevitals.app.android"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            storeFile = file("vehicle-vitals-key.jks")
            storePassword = System.getenv("ANDROID_STORE_PASSWORD") ?: "android"
            keyAlias = "vehicle-vitals"
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD") ?: "android"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            // Debug builds don't require signing in CI/CD
            // Sign with release config only if keystore exists locally
        }
    }
}

dependencies {
    // Firebase App Distribution dependency removed - using Firebase CLI instead
}

// firebaseAppDistribution { // Removed - using Firebase CLI instead
//     appId = System.getenv("FIREBASE_APP_ID_ANDROID") ?: "1:489413148337:android:0ed732a4b8cd462068ac90"
//     serviceCredentialsFile = System.getenv("ANDROID_SERVICE_ACCOUNT_KEY_FILE") ?: "service-account-key.json"
//     releaseNotes = System.getenv("RELEASE_NOTES") ?: "Release notes not provided"
//     groups = System.getenv("TESTER_GROUPS") ?: "internal-testers"
// }

flutter {
    source = "../.."
}
