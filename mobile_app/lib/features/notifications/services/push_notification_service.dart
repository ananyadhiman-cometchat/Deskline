import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'notification_api_service.dart';
import '../../../core/networking/dio_client.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class PushNotificationService {
  PushNotificationService._();

  static RemoteMessage? launchMessage;

  /// Initialize Firebase and register listeners.
  /// FCM token registration to backend is deferred — call [registerToken]
  /// after the user is authenticated and DioClient is available.
  static Future<void> initialize() async {
    await Firebase.initializeApp();
    await FirebaseMessaging.instance.requestPermission();

    FirebaseMessaging.onBackgroundMessage(
      firebaseMessagingBackgroundHandler,
    );

    FirebaseMessaging.onMessage.listen((message) {
      debugPrint('FCM message received: ${message.messageId}');
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      launchMessage = message;
      debugPrint('Notification opened: ${message.messageId}');
    });

    launchMessage = await FirebaseMessaging.instance.getInitialMessage();

    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      debugPrint('FCM token refreshed: $token');
    });
  }

  /// Register device FCM token with the backend.
  /// Should be called after successful login when DioClient is available.
  static Future<void> registerToken(DioClient dioClient) async {
    final token = await getDeviceToken();
    if (token != null) {
      try {
        await NotificationApiService(dioClient).registerFcmToken(token);
      } catch (_) {
        // Silently fail — token will be retried on next app launch/login
      }
    }
  }

  static Future<String?> getDeviceToken() async {
    return FirebaseMessaging.instance.getToken();
  }
}