# ─── Flutter ──────────────────────────────────────────────────────────────────
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# ─── CometChat SDK ────────────────────────────────────────────────────────────
-keep class com.cometchat.** { *; }
-keep interface com.cometchat.** { *; }
-dontwarn com.cometchat.**

# ─── CometChat Calls SDK (referenced by chat SDK, but in a separate AAR) ──────
# R8 cannot find these in the current dependency graph so we suppress the warnings.
# The chat SDK references them via reflection/weak imports; they are not needed at
# runtime unless the user actually initiates a call through the legacy Call API
# (DeskLine uses the meeting-message pattern instead).
-dontwarn com.cometchat.calls.CometChatRTCView
-dontwarn com.cometchat.calls.CometChatRTCView$CometChatRTCViewBuilder
-dontwarn com.cometchat.calls.CometChatRTCViewListener
-dontwarn com.cometchat.calls.model.AnalyticsSettings
-dontwarn com.cometchat.calls.model.RTCCallback
-dontwarn com.cometchat.calls.model.RTCReceiver

# ─── Google Play Core (Flutter deferred components — not used in this app) ────
# Flutter's engine references these for Play Store deferred component delivery.
# Since we don't use deferred components, these can be safely suppressed.
-dontwarn com.google.android.play.core.splitcompat.SplitCompatApplication
-dontwarn com.google.android.play.core.splitinstall.SplitInstallException
-dontwarn com.google.android.play.core.splitinstall.SplitInstallManager
-dontwarn com.google.android.play.core.splitinstall.SplitInstallManagerFactory
-dontwarn com.google.android.play.core.splitinstall.SplitInstallRequest
-dontwarn com.google.android.play.core.splitinstall.SplitInstallRequest$Builder
-dontwarn com.google.android.play.core.splitinstall.SplitInstallSessionState
-dontwarn com.google.android.play.core.splitinstall.SplitInstallStateUpdatedListener
-dontwarn com.google.android.play.core.tasks.OnFailureListener
-dontwarn com.google.android.play.core.tasks.OnSuccessListener
-dontwarn com.google.android.play.core.tasks.Task

# ─── Firebase / Google ────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# ─── OkHttp / Retrofit (used by CometChat internally) ─────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ─── WebRTC (used by Calls SDK) ───────────────────────────────────────────────
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

# ─── React Native runtime (embedded by the CometChat Calls SDK call view) ─────
# CometChat's call screen is rendered with an embedded React Native runtime.
# At call time, com.cometchat.calls.modules.ReactInstanceManagerHolder loads its
# native modules REFLECTIVELY via getReactNativePackages(). R8 can't see those
# reflective references, so on minified release builds it strips the classes and
# the call view crashes the app with NoClassDefFoundError / ClassNotFoundException
# (e.g. com.horcrux.svg.SvgPackage, com.facebook.react.soloader.OpenSourceMergedSoMapping).
# Emulator/debug builds aren't minified, which is why this only crashed on the
# installed release APK on a physical device. Keep every RN package the SDK bundles.
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**
-keep class com.horcrux.svg.** { *; }
-keep class com.oney.WebRTCModule.** { *; }
-keep class com.ocetnik.timer.** { *; }
-keep class com.oblador.performance.** { *; }
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native bridges native modules by name/annotation — these must survive R8.
-keep @com.facebook.proguard.annotations.DoNotStrip class * { *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.ReactPackage { *; }
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }

# ─── Keep Parcelable / Serializable models ────────────────────────────────────
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ─── React Native & CometChat Community Plugins ───────────────────────────────
# CometChat Calls SDK is kept above, which prevents its classes from being renamed.
# However, it explicitly references React Native and its community plugins.
# If these aren't kept, R8 renames them, causing NoClassDefFoundErrors at runtime
# when CometChat tries to instantiate them by their original un-renamed names.
-keep class com.facebook.react.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.react.**

-keep class com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**

-keep class com.oney.WebRTCModule.** { *; }
-dontwarn com.oney.WebRTCModule.**

-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

-keep class com.ocetnik.timer.** { *; }
-dontwarn com.ocetnik.timer.**

-keep class com.oblador.performance.** { *; }
-dontwarn com.oblador.performance.**

