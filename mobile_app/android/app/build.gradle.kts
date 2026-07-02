plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.deskline"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.deskline"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = 26
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    packaging {
        jniLibs {
            pickFirsts += listOf(
                "lib/x86/libc++_shared.so",
                "lib/x86_64/libc++_shared.so",
                "lib/armeabi-v7a/libc++_shared.so",
                "lib/arm64-v8a/libc++_shared.so",
                "lib/x86/libfbjni.so",
                "lib/x86_64/libfbjni.so",
                "lib/armeabi-v7a/libfbjni.so",
                "lib/arm64-v8a/libfbjni.so"
            )
        }
    }

    buildTypes {
        release {
            // Signing with debug keys for now (works for local device testing).
            // Replace with a proper keystore before Play Store submission.
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = false
            isShrinkResources = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}

// The CometChat chat-sdk-android pulls in the legacy com.android.support:*:26.1.0
// library transitively, which collides with AndroidX (duplicate classes like
// android.support.v4.app.INotificationSideChannel). AGP 9 dropped Jetifier, so
// we exclude the entire old support group — the SDK itself targets AndroidX and
// does not use these legacy classes at runtime.
configurations.all {
    exclude(group = "com.android.support")
    exclude(group = "android.arch.lifecycle")
    exclude(group = "android.arch.core")
    
    // Pin React Native to 0.77.2 — the EXACT version the CometChat Calls SDK
    // 5.0.1 declares in its POM (react-android + hermes-android both 0.77.2),
    // and the version its bundled modules (react-native-svg 15.11.2, webrtc 124)
    // were compiled against. They must all match the core or class loading fails
    // at call time (NoClassDefFoundError: com.horcrux.svg.SvgPackage).
    //
    // Do NOT downgrade to 0.73.x: RN 0.77 merged all native libs into a single
    // libreactnative.so, so the separate libreact_*jni.so files no longer exist —
    // mixing a 0.73 core with 0.77 modules breaks both class linking and JNI.
    resolutionStrategy {
        force("com.facebook.react:react-android:0.77.2")
        force("com.facebook.react:hermes-android:0.77.2")
    }
}
