import 'dart:async';

import 'package:cometchat_chat_uikit/cometchat_chat_uikit.dart';

import '../core/networking/api_endpoints.dart';
import '../core/networking/dio_client.dart';
import 'cometchat_config.dart';

/// Result of the CometChat initialization process.
class CometChatInitResult {
  final bool isInitialized;
  final String? error;

  const CometChatInitResult({required this.isInitialized, this.error});

  const CometChatInitResult.success()
      : isInitialized = true,
        error = null;

  const CometChatInitResult.failure(String message)
      : isInitialized = false,
        error = message;
}

/// Manages CometChat SDK initialization and login using a Completer pattern
/// to ensure initialization only runs once even if called from multiple places.
class CometChatInitializer {
  CometChatInitializer._();

  static final CometChatInitializer _instance = CometChatInitializer._();

  /// Singleton instance.
  static CometChatInitializer get instance => _instance;

  /// Maximum number of retry attempts for initialization.
  static const int _maxRetries = 3;

  /// Completer to guard against concurrent initialization.
  Completer<CometChatInitResult>? _initCompleter;

  /// Whether the SDK has been successfully initialized and the user is logged in.
  bool _isReady = false;
  bool get isReady => _isReady;

  /// Initialize the CometChat SDK and log in with an auth token from the backend.
  ///
  /// Uses a Completer to ensure this only runs once. Subsequent calls return
  /// the same Future.
  ///
  /// [dioClient] is used to fetch the auth token from the DeskLine backend.
  Future<CometChatInitResult> initialize(DioClient dioClient) async {
    // If already in progress or completed, return existing future
    if (_initCompleter != null) {
      return _initCompleter!.future;
    }

    _initCompleter = Completer<CometChatInitResult>();

    try {
      final result = await _performInitialization(dioClient);
      _isReady = result.isInitialized;
      _initCompleter!.complete(result);
    } catch (e) {
      final result = CometChatInitResult.failure(e.toString());
      _initCompleter!.complete(result);
    }

    return _initCompleter!.future;
  }

  /// Reset the initializer state (useful for logout/re-login scenarios).
  void reset() {
    _initCompleter = null;
    _isReady = false;
  }

  /// Performs SDK init + login with retry and exponential backoff.
  Future<CometChatInitResult> _performInitialization(
    DioClient dioClient,
  ) async {
    if (!CometChatConfig.isConfigured) {
      return const CometChatInitResult.failure(
        'CometChat configuration missing. Ensure COMETCHAT_APP_ID and '
        'COMETCHAT_REGION are provided via --dart-define.',
      );
    }

    // Step 1: Initialize the SDK with retry
    final initResult = await _initSdkWithRetry();
    if (!initResult.isInitialized) {
      return initResult;
    }

    // Step 2: Fetch auth token from backend and login with retry
    final loginResult = await _loginWithRetry(dioClient);
    return loginResult;
  }

  /// Initialize CometChatUIKit with retry and exponential backoff.
  Future<CometChatInitResult> _initSdkWithRetry() async {
    for (int attempt = 0; attempt < _maxRetries; attempt++) {
      try {
        final uiKitSettings = (UIKitSettingsBuilder()
              ..subscriptionType = CometChatSubscriptionType.allUsers
              ..region = CometChatConfig.region
              ..autoEstablishSocketConnection = true
              ..appId = CometChatConfig.appId)
            .build();

        final completer = Completer<void>();
        CometChatException? initError;

        await CometChatUIKit.init(
          uiKitSettings: uiKitSettings,
          onSuccess: (_) {
            if (!completer.isCompleted) completer.complete();
          },
          onError: (e) {
            initError = e;
            if (!completer.isCompleted) completer.complete();
          },
        );

        await completer.future;

        if (initError != null) {
          throw initError!;
        }

        return const CometChatInitResult.success();
      } catch (e) {
        if (attempt < _maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await Future.delayed(Duration(seconds: 1 << attempt));
        } else {
          return CometChatInitResult.failure(
            'CometChat SDK initialization failed after $_maxRetries attempts: $e',
          );
        }
      }
    }

    // Unreachable, but satisfies the return type
    return const CometChatInitResult.failure(
      'CometChat SDK initialization failed unexpectedly.',
    );
  }

  /// Fetch auth token from backend and login to CometChat with retry.
  Future<CometChatInitResult> _loginWithRetry(DioClient dioClient) async {
    for (int attempt = 0; attempt < _maxRetries; attempt++) {
      try {
        // Fetch auth token from DeskLine backend
        final response = await dioClient.dio.post(
          ApiEndpoints.cometchatAuthToken,
        );

        final authToken = response.data['authToken'] as String?;
        if (authToken == null || authToken.isEmpty) {
          throw Exception('Auth token not found in response');
        }

        // Login to CometChat with the auth token
        final loginCompleter = Completer<void>();
        CometChatException? loginError;

        await CometChatUIKit.loginWithAuthToken(
          authToken,
          onSuccess: (_) {
            if (!loginCompleter.isCompleted) loginCompleter.complete();
          },
          onError: (e) {
            loginError = e;
            if (!loginCompleter.isCompleted) loginCompleter.complete();
          },
        );

        await loginCompleter.future;

        if (loginError != null) {
          throw loginError!;
        }

        return const CometChatInitResult.success();
      } catch (e) {
        if (attempt < _maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await Future.delayed(Duration(seconds: 1 << attempt));
        } else {
          return CometChatInitResult.failure(
            'CometChat login failed after $_maxRetries attempts: $e',
          );
        }
      }
    }

    // Unreachable, but satisfies the return type
    return const CometChatInitResult.failure(
      'CometChat login failed unexpectedly.',
    );
  }
}
