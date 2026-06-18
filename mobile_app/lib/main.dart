import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'features/notifications/services/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase FIRST — must complete before any provider accesses it
  try {
    await Firebase.initializeApp(options: firebaseOptions);
    debugPrint('✓ Firebase initialized');
  } catch (e) {
    debugPrint('✗ Firebase init failed: $e');
  }

  // Then set up push notification listeners (requires Firebase)
  try {
    await PushNotificationService.initialize();
    debugPrint('✓ Push notifications initialized');
  } catch (e, stack) {
    debugPrint('✗ Push notification init failed: $e');
    debugPrint(stack.toString());
  }

  runApp(
    const ProviderScope(
      child: DesklineApp(),
    ),
  );
}
