import 'dart:async';

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'cometchat/services/cometchat_push_service.dart';
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

  // NOTE: The CometChat Calls SDK is intentionally NOT initialized here.
  // CometChatCalls.init() requires the core CometChat SDK (CometChat.init via
  // CometChatUIKit.init) to be initialized first — which only happens after
  // login. Initializing calls here (before core init) makes iOS throw
  // "Please call the CometChat.init() method" when a call starts. Calls init
  // now runs in CometChatInitializer._initCallsSdk(), after core init.

  // Set up push notification listeners (requires Firebase).
  // Wrapped with a timeout: if flutter_local_notifications or any SDK
  // requests an OS permission dialog that never resolves, runApp() would
  // be permanently blocked and the user would see a white screen.
  try {
    await PushNotificationService.initialize()
        .timeout(const Duration(seconds: 5));
    debugPrint('✓ Push notifications initialized');
  } on TimeoutException {
    debugPrint('⚠ Push notification init timed out — proceeding without foreground notifications');
  } catch (e, stack) {
    debugPrint('✗ Push notification init failed: $e');
    debugPrint(stack.toString());
  }

  // Create the dedicated CometChat notification channel so chat/call
  // notifications display correctly on Android 8+ (separate from DeskLine's).
  try {
    await CometChatPushService.initializeChannel()
        .timeout(const Duration(seconds: 5));
    debugPrint('✓ CometChat notification channel initialized');
  } on TimeoutException {
    debugPrint('⚠ CometChat notification channel init timed out');
  } catch (e) {
    debugPrint('✗ CometChat notification channel init failed: $e');
  }

  runApp(
    const ProviderScope(
      child: DesklineApp(),
    ),
  );
}
