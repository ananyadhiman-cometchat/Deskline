import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'features/notifications/services/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await PushNotificationService.initialize();
    debugPrint('✓ Push notifications initialized');
  } catch (e, stack) {
    // Firebase may fail on iOS simulator (no GoogleService-Info.plist in bundle)
    // or if Firebase is not configured. App continues without push notifications.
    debugPrint('✗ Push notification init failed: $e');
    debugPrint(stack.toString());
  }

  runApp(
    const ProviderScope(
      child: DesklineApp(),
    ),
  );
}
