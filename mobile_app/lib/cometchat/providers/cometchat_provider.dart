import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/networking/dio_provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../cometchat_init.dart';
import '../services/cometchat_push_service.dart';

/// State representing CometChat initialization status.
class CometChatState {
  final bool isInitialized;
  final bool isLoading;
  final String? error;

  const CometChatState({
    this.isInitialized = false,
    this.isLoading = false,
    this.error,
  });

  CometChatState copyWith({
    bool? isInitialized,
    bool? isLoading,
    String? error,
  }) {
    return CometChatState(
      isInitialized: isInitialized ?? this.isInitialized,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Riverpod provider exposing CometChat initialization state.
///
/// Exposes [isInitialized], [isLoading], and [error] states.
/// Call [initialize] after the user is authenticated.
final cometchatProvider =
    StateNotifierProvider<CometChatNotifier, CometChatState>((ref) {
  return CometChatNotifier(ref);
});

class CometChatNotifier extends StateNotifier<CometChatState> {
  final Ref _ref;

  CometChatNotifier(this._ref) : super(const CometChatState());

  /// Initialize CometChat SDK and login the current user.
  ///
  /// Safe to call multiple times — the underlying Completer prevents
  /// duplicate initialization.
  Future<void> initialize() async {
    if (state.isInitialized || state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    final dioClient = _ref.read(dioClientProvider);
    // The CometChat UID is the DeskLine user id (see backend cometchat-auth
    // service). Passing it lets init discard a persisted session belonging to
    // a previously logged-in user.
    final expectedUid = _ref.read(authStateProvider).user?.id;
    final result = await CometChatInitializer.instance
        .initialize(dioClient, expectedUid: expectedUid);

    if (result.isInitialized) {
      state = const CometChatState(isInitialized: true);
      debugPrint('[CometChatProvider] ✓ Initialized successfully');
      // Register the FCM token with CometChat so this device receives
      // chat/call push notifications when the user is offline.
      await CometChatPushService.registerToken();
    } else {
      debugPrint('[CometChatProvider] ✗ Init failed: ${result.error}');
      state = CometChatState(error: result.error);
    }
  }

  /// Tear down the CometChat session on logout.
  ///
  /// Unregisters this device's push token (so the logged-out user stops
  /// receiving chat/call notifications), logs out of the CometChat SDK to
  /// clear the natively-persisted session, and resets the provider state so
  /// the next user runs a clean initialize + login.
  Future<void> reset() async {
    try {
      await CometChatPushService.unregisterToken();
    } catch (_) {
      // Best-effort — never block logout on push cleanup.
    }
    await CometChatInitializer.instance.logout();
    state = const CometChatState();
  }
}
