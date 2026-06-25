import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../../core/networking/dio_client.dart';
import '../../../cometchat/services/cometchat_push_service.dart';
import 'local_notification_service.dart';
import 'notification_api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await _ensureFirebaseInitialized();
}

/// Firebase options derived from GoogleService-Info.plist / google-services.json
FirebaseOptions get firebaseOptions {
  if (Platform.isIOS) {
    return const FirebaseOptions(
      apiKey: 'AIzaSyCU9mRpSU-mGEl3HEoZUF-k2voNvzU-LjA',
      appId: '1:295880840179:ios:ab3b24444407b844c8b886',
      messagingSenderId: '295880840179',
      projectId: 'deskline-81719',
      storageBucket: 'deskline-81719.firebasestorage.app',
      iosBundleId: 'com.cometchat.interns',
    );
  }
  return const FirebaseOptions(
    apiKey: 'AIzaSyDkrfahHrRlxBv1n5sp_u1N-lXIhm-U_og',
    appId: '1:295880840179:android:60f3292de667cc77c8b886',
    messagingSenderId: '295880840179',
    projectId: 'deskline-81719',
    storageBucket: 'deskline-81719.firebasestorage.app',
  );
}

Future<void> _ensureFirebaseInitialized() async {
  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(options: firebaseOptions);
  }
}

class PushNotificationService {
  PushNotificationService._();

  static RemoteMessage? launchMessage;

  /// Initialize Firebase, local notifications, and register listeners.
  /// FCM token registration to backend is deferred — call [registerToken]
  /// after the user is authenticated and DioClient is available.
  static Future<void> initialize() async {
    // Firebase.initializeApp() is called in main() before this
    await _ensureFirebaseInitialized();
    
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('🔔 Notification permission status: ${settings.authorizationStatus}');

    // Get and print APNs token (iOS only)
    final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
    debugPrint('🍎 APNs token: $apnsToken');

    // Get and print FCM token
    final fcmToken = await FirebaseMessaging.instance.getToken();
    debugPrint('🔥 FCM token: $fcmToken');

    // Initialize local notification plugin for foreground display
    await LocalNotificationService.initialize();

    // Background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Foreground message handler — show in system tray via local notifications
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification tap when app is in background → brought to foreground
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      launchMessage = message;
      debugPrint('Notification opened: ${message.messageId}');
    });

    // Check if app was opened from a terminated state via notification
    launchMessage = await FirebaseMessaging.instance.getInitialMessage();

    // Listen for token refresh
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      debugPrint('FCM token refreshed: $token');
    });

    // Set foreground notification presentation options (iOS)
    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Handle messages received while app is in the foreground.
  /// Displays a local notification in the system tray.
  ///
  /// Routes CometChat push payloads (chat messages, calls) to the dedicated
  /// CometChat notification channel, and DeskLine app notifications to the
  /// default channel — so the two coexist without conflict.
  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('FCM foreground message: ${message.messageId}');

    // Route CometChat-originated push notifications to their own channel.
    if (CometChatPushService.isCometChatNotification(message)) {
      final ccNotification = message.notification;
      final ccTitle = ccNotification?.title ??
          message.data['title'] as String? ??
          'New message';
      final ccBody = ccNotification?.body ??
          message.data['body'] as String? ??
          '';
      CometChatPushService.showNotification(
        title: ccTitle,
        body: ccBody,
        payload: message.data['conversationId'] as String?,
      );
      return;
    }

    final notification = message.notification;
    if (notification == null) return;

    final title = notification.title ?? 'DeskLine';
    final body = notification.body ?? '';

    // Show in system notification tray
    LocalNotificationService.show(
      title: title,
      body: body,
      payload: message.data['ticketId'],
    );
  }

  /// Register device FCM token with the backend.
  /// Should be called after successful login when DioClient is available.
  static Future<void> registerToken(DioClient dioClient) async {
    try {
      await _ensureFirebaseInitialized();

      final token = await getDeviceToken();
      if (token != null) {
        await NotificationApiService(dioClient).registerFcmToken(token);
        debugPrint('FCM token registered with backend: $token');
      } else {
        debugPrint('FCM token is null — APNs token may not be ready yet. Retrying in 5s...');
        await Future.delayed(const Duration(seconds: 5));
        final retryToken = await getDeviceToken();
        if (retryToken != null) {
          await NotificationApiService(dioClient).registerFcmToken(retryToken);
          debugPrint('FCM token registered with backend (retry): $retryToken');
        } else {
          debugPrint('FCM token still null after retry. Push notifications will not work.');
        }
      }
    } catch (e) {
      debugPrint('FCM token registration failed: $e');
    }
  }

  static Future<String?> getDeviceToken() async {
    return FirebaseMessaging.instance.getToken();
  }
}
