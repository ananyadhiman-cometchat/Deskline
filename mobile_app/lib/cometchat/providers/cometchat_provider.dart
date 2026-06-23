import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/networking/dio_provider.dart';
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
    final result = await CometChatInitializer.instance.initialize(dioClient);

    if (result.isInitialized) {
      state = const CometChatState(isInitialized: true);
      debugPrint('[CometChatProvider] ✓ Initialized successfully');
      CometChatPushService.registerToken();
    } else {
      debugPrint('[CometChatProvider] ✗ Init failed: ${result.error}');
      state = CometChatState(error: result.error);
    }
  }

  /// Reset the CometChat state (e.g. on logout).
  void reset() {
    CometChatInitializer.instance.reset();
    state = const CometChatState();
  }
}
