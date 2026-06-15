import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../../core/networking/dio_client.dart';
import 'local_notification_service.dart';
import 'notification_api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Background messages with `notification` payload are auto-displayed by FCM.
  // No additional handling needed here.
}

class PushNotificationService {
  PushNotificationService._();

  static RemoteMessage? launchMessage;

  /// Initialize Firebase, local notifications, and register listeners.
  /// FCM token registration to backend is deferred — call [registerToken]
  /// after the user is authenticated and DioClient is available.
  static Future<void> initialize() async {
    await Firebase.initializeApp();
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

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
  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('FCM foreground message: ${message.messageId}');

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
    final token = await getDeviceToken();
    if (token != null) {
      try {
        await NotificationApiService(dioClient).registerFcmToken(token);
        debugPrint('FCM token registered with backend');
      } catch (e) {
        debugPrint('FCM token registration failed: $e');
      }
    }
  }

  static Future<String?> getDeviceToken() async {
    return FirebaseMessaging.instance.getToken();
  }
}
