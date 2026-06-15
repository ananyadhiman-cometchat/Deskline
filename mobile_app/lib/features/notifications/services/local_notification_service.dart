import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Handles displaying notifications in the system tray.
/// Used when the app is in the foreground and FCM delivers via onMessage.
class LocalNotificationService {
  LocalNotificationService._();

  static final _plugin = FlutterLocalNotificationsPlugin();

  static const _androidChannel = AndroidNotificationChannel(
    'deskline_notifications',
    'DeskLine Notifications',
    description: 'Notifications for ticket updates, assignments, and alerts.',
    importance: Importance.high,
  );

  /// Initialize the plugin. Call once at app startup.
  static Future<void> initialize() async {
    // Android initialization
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS initialization
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false, // Already requested via firebase_messaging
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create the Android notification channel
    final androidPlugin =
        _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(
      AndroidNotificationChannel(
        _androidChannel.id,
        _androidChannel.name,
        description: _androidChannel.description,
        importance: _androidChannel.importance,
      ),
    );
  }

  /// Show a notification in the system tray.
  static Future<void> show({
    required String title,
    required String body,
    String? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      _androidChannel.id,
      _androidChannel.name,
      channelDescription: _androidChannel.description,
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
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

    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000, // unique ID
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Handle notification tap (navigate to relevant screen).
  static void _onNotificationTap(NotificationResponse response) {
    // The payload can contain a route or ticket ID for deep linking.
    // For now, tapping just opens the app (default behavior).
    // Deep linking can be added later by reading response.payload.
  }
}
