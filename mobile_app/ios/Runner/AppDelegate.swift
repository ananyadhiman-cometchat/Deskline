import Flutter
import UIKit
import FirebaseMessaging

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {

  // CometChat's iOS UIKit plugin reads `UIApplication.shared.delegate?.window`
  // during registration and force-unwraps it. In a scene-based app the scene
  // owns the window, so a stored AppDelegate window is nil → crash. Assigning a
  // stored window instead conflicts with the scene and blanks the screen.
  //
  // Solution: expose the active scene's key window through a COMPUTED property.
  // CometChat gets a valid window; we never store one, so UIKit's scene-based
  // rendering is untouched (no white/black screen).
  override var window: UIWindow? {
    get {
      let scenes = UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
      return scenes.flatMap { $0.windows }.first { $0.isKeyWindow }
        ?? scenes.flatMap { $0.windows }.first
    }
    set { /* The scene owns the window — ignore writes. */ }
  }

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Ensure iOS issues an APNs device token (push notifications).
    application.registerForRemoteNotifications()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    // Defer registration one run-loop turn so the scene has connected and its
    // key window exists when CometChat reads `window` (above) during register.
    DispatchQueue.main.async {
      GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    }
  }

  // Forward the APNs device token to Firebase directly. Because plugin
  // registration is deferred (for CometChat), firebase_messaging's swizzling
  // can install too late to capture this automatically — so we set it here.
  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    NSLog("⚠️ Failed to register for remote notifications: \(error.localizedDescription)")
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }
}
