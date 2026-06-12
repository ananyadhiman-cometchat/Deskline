import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'notification_api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

class PushNotificationService {
  PushNotificationService._();

  static RemoteMessage? launchMessage;

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

    final token = await getDeviceToken();
    if (token != null) {
      try {
        await NotificationApiService().registerFcmToken(token);
      } catch (_) {}
    }

    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      debugPrint('FCM token refreshed: $token');
    });
  }

  static Future<String?> getDeviceToken() async {
    return FirebaseMessaging.instance.getToken();
  }
}