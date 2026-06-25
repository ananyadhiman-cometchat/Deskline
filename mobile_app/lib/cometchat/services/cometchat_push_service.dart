import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';

/// Manages CometChat push notification integration.
///
/// Responsibilities:
/// - Register/unregister the device FCM token with CometChat on login/logout
/// - Create a dedicated Android notification channel for CometChat messages
/// - Handle incoming CometChat push notifications (foreground display)
/// - Coexist with the existing DeskLine [PushNotificationService] without conflicts
///
/// The existing DeskLine notifications use channel ID 'deskline_notifications'.
/// CometChat notifications use a separate channel ID 'cometchat_messages'.
class CometChatPushService {
  CometChatPushService._();

  static final _localNotificationsPlugin = FlutterLocalNotificationsPlugin();

  /// Android notification channel dedicated to CometChat messages.
  /// Separate from the DeskLine 'deskline_notifications' channel.
  static const _cometChatChannel = AndroidNotificationChannel(
    'cometchat_messages',
    'Chat Messages',
    description:
        'Notifications for new chat messages and incoming calls via CometChat.',
    importance: Importance.high,
  );

  /// Whether the CometChat notification channel has been created.
  static bool _channelInitialized = false;

  /// FCM provider ID configured in the CometChat dashboard.
  /// Override at build time with: --dart-define=COMETCHAT_FCM_PROVIDER_ID=...
  static const _fcmProviderId = String.fromEnvironment(
    'COMETCHAT_FCM_PROVIDER_ID',
    defaultValue: 'deskline-fcm',
  );

  /// Initialize the CometChat notification channel.
  /// Call once during app startup (after [LocalNotificationService.initialize]).
  ///
  /// This creates a separate Android notification channel for CometChat
  /// so that users can independently control DeskLine app notifications
  /// and CometChat chat notifications in system settings.
  static Future<void> initializeChannel() async {
    if (_channelInitialized) return;

    final androidPlugin = _localNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(
        AndroidNotificationChannel(
          _cometChatChannel.id,
          _cometChatChannel.name,
          description: _cometChatChannel.description,
          importance: _cometChatChannel.importance,
        ),
      );
    }

    _channelInitialized = true;
    debugPrint('💬 CometChat notification channel initialized');
  }

  /// Register the device FCM token with CometChat for push notification delivery.
  ///
  /// Should be called after:
  /// 1. Firebase is initialized
  /// 2. CometChat SDK is initialized and user is logged in
  ///
  /// This enables CometChat to send push notifications for new messages
  /// and incoming calls when the app is in the background or terminated.
  static Future<void> registerToken() async {
    debugPrint('💬 CometChat push: registerToken() called (provider=$_fcmProviderId)');
    try {
      // On iOS, FCM cannot issue a token until Apple has delivered the APNS
      // token to the device. This arrives asynchronously after launch, so we
      // poll for it before attempting registration. Without the APNS token,
      // getToken() throws `apns-token-not-set` and push never works.
      if (Platform.isIOS) {
        String? apnsToken = await FirebaseMessaging.instance.getAPNSToken();
        var attempts = 0;
        while (apnsToken == null && attempts < 10) {
          await Future.delayed(const Duration(seconds: 2));
          apnsToken = await FirebaseMessaging.instance.getAPNSToken();
          attempts++;
        }
        if (apnsToken == null) {
          debugPrint(
              '💬 CometChat push: APNS token still null after waiting. '
              'Check: (1) Push Notifications + Background Modes capabilities in Xcode, '
              '(2) APNs Auth Key (.p8) uploaded to Firebase Console, '
              '(3) running on a real device with a valid provisioning profile.');
          return;
        }
        debugPrint('💬 CometChat push: APNS token received ✓');
      }

      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken == null) {
        debugPrint(
            '💬 CometChat push: FCM token is null, skipping registration');
        return;
      }

      final platform = Platform.isAndroid
          ? PushPlatforms.FCM_FLUTTER_ANDROID
          : PushPlatforms.FCM_FLUTTER_IOS;

      await CometChatNotifications.registerPushToken(
        platform,
        providerId: _fcmProviderId,
        fcmToken: fcmToken,
        onSuccess: (response) {
          debugPrint('💬 CometChat push: FCM token registered successfully');
        },
        onError: (e) {
          debugPrint(
              '💬 CometChat push: Token registration failed - ${e.message}');
        },
      );

      // Listen for token refresh and re-register with CometChat
      FirebaseMessaging.instance.onTokenRefresh.listen(_onTokenRefresh);
    } catch (e) {
      debugPrint('💬 CometChat push: Token registration failed - $e');
    }
  }

  /// Unregister the device FCM token from CometChat.
  ///
  /// Should be called before CometChat logout to stop push notification
  /// delivery to this device. Ensures the user does not receive
  /// CometChat notifications after logging out.
  static Future<void> unregisterToken() async {
    try {
      await CometChatNotifications.unregisterPushToken(
        onSuccess: (_) {
          debugPrint(
              '💬 CometChat push: FCM token unregistered successfully');
        },
        onError: (e) {
          debugPrint(
              '💬 CometChat push: Token unregistration failed - ${e.message}');
        },
      );
    } catch (e) {
      debugPrint('💬 CometChat push: Token unregistration failed - $e');
    }
  }

  /// Handle FCM token refresh — re-register with CometChat.
  static Future<void> _onTokenRefresh(String newToken) async {
    try {
      final platform = Platform.isAndroid
          ? PushPlatforms.FCM_FLUTTER_ANDROID
          : PushPlatforms.FCM_FLUTTER_IOS;

      await CometChatNotifications.registerPushToken(
        platform,
        providerId: _fcmProviderId,
        fcmToken: newToken,
        onSuccess: (_) {
          debugPrint('💬 CometChat push: Refreshed token registered');
        },
        onError: (e) {
          debugPrint(
              '💬 CometChat push: Refreshed token registration failed - ${e.message}');
        },
      );
    } catch (e) {
      debugPrint(
          '💬 CometChat push: Refreshed token registration failed - $e');
    }
  }

  /// Determine if a [RemoteMessage] is a CometChat push notification.
  ///
  /// CometChat push payloads include specific keys like 'type' with values
  /// 'chat' or 'call', and a 'conversationId' field.
  static bool isCometChatNotification(RemoteMessage message) {
    final data = message.data;
    // CometChat notifications include specific keys in the data payload
    return data.containsKey('type') &&
        (data['type'] == 'chat' ||
            data['type'] == 'call' ||
            data.containsKey('conversationId'));
  }

  /// Display a CometChat notification in the system tray using the
  /// dedicated CometChat notification channel.
  ///
  /// This ensures CometChat notifications appear separately from
  /// DeskLine app notifications in Android notification settings.
  static Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      _cometChatChannel.id,
      _cometChatChannel.name,
      channelDescription: _cometChatChannel.description,
      importance: Importance.high,
      priority: Priority.high,
      icon: 'ic_notification',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotificationsPlugin.show(
      // Use a different ID range to avoid collision with DeskLine notifications
      DateTime.now().millisecondsSinceEpoch ~/ 1000 + 100000,
      title,
      body,
      details,
      payload: payload,
    );
  }
}
