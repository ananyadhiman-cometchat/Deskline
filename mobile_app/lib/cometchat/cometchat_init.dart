import 'dart:async';

import 'package:cometchat_calls_sdk/cometchat_calls_sdk.dart';
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
      // ignore: avoid_print
      print('[CometChatInit] ✗ SDK init failed: ${initResult.error}');
      return initResult;
    }
    // ignore: avoid_print
    print('[CometChatInit] ✓ SDK init succeeded');

    // Step 2: Fetch auth token from backend and login with retry.
    // The auth token is captured so the Calls SDK can reuse it.
    final loginResult = await _loginWithRetry(dioClient);
    if (!loginResult.isInitialized) {
      // ignore: avoid_print
      print('[CometChatInit] ✗ Login failed: ${loginResult.error}');
      return loginResult;
    }
    // ignore: avoid_print
    print('[CometChatInit] ✓ Login succeeded');

    // Step 3: Initialize + login the Calls SDK (v5 has its own lifecycle).
    // Non-fatal: chat still works if calls init fails, but calling won't.
    await _initCallsSdk();
    // ignore: avoid_print
    print('[CometChatInit] ✓ Calls SDK init complete');

    return loginResult;
  }

  /// The CometChat auth token captured during chat login, reused for the
  /// Calls SDK login (so we don't fetch a second token).
  String? _capturedAuthToken;

  /// Initialize and login the v5 Calls SDK so voice/video calling works.
  ///
  /// Mirrors the web's [initCallsWithRetry] pattern: exponential backoff with
  /// up to [_maxRetries] attempts (1 s, 2 s, 4 s delays). Non-fatal — chat
  /// features remain functional even if calls init fails.
  Future<void> _initCallsSdk() async {
    try {
      await _initCallsSdkWithRetry();
      await _loginCallsSdkWithRetry();
    } catch (e) {
      // ignore: avoid_print
      print('[CometChat] Calls SDK init/login failed: $e');
    }
  }

  /// Init the Calls SDK with exponential backoff, matching the web's
  /// [initCallsWithRetry] implementation.
  Future<void> _initCallsSdkWithRetry() async {
    Object? lastError;

    for (int attempt = 0; attempt < _maxRetries; attempt++) {
      try {
        final callAppSettings = (CallAppSettingBuilder()
              ..appId = CometChatConfig.appId
              ..region = CometChatConfig.region)
            .build();

        final completer = Completer<void>();
        CometChatCalls.init(
          callAppSettings,
          onSuccess: (_) {
            if (!completer.isCompleted) completer.complete();
          },
          onError: (CometChatCallsException e) {
            if (!completer.isCompleted) completer.completeError(e);
          },
        );
        await completer.future;
        return; // success
      } catch (e) {
        lastError = e;
        if (attempt < _maxRetries - 1) {
          await Future.delayed(Duration(seconds: 1 << attempt)); // 1s, 2s, 4s
        }
      }
    }

    throw lastError ?? Exception('Calls SDK init failed');
  }

  /// Login the Calls SDK with exponential backoff, matching the web pattern.
  Future<void> _loginCallsSdkWithRetry() async {
    final authToken = _capturedAuthToken ?? await CometChat.getUserAuthToken();
    if (authToken == null || authToken.isEmpty) {
      return; // Can't login calls without a token; chat still works.
    }

    Object? lastError;

    for (int attempt = 0; attempt < _maxRetries; attempt++) {
      try {
        final completer = Completer<void>();
        CometChatCalls.loginWithAuthToken(
          authToken: authToken,
          onSuccess: (_) {
            if (!completer.isCompleted) completer.complete();
          },
          onError: (CometChatCallsException e) {
            if (!completer.isCompleted) completer.completeError(e);
          },
        );
        await completer.future;
        return; // success
      } catch (e) {
        lastError = e;
        if (attempt < _maxRetries - 1) {
          await Future.delayed(Duration(seconds: 1 << attempt));
        }
      }
    }

    throw lastError ?? Exception('Calls SDK login failed');
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
        // Check if the user is already logged in (e.g. SDK persisted session).
        // If so, skip the login step entirely — calling loginWithAuthToken
        // again can cause the SDK to hang without firing any callback.
        final alreadyLoggedIn = await CometChat.getLoggedInUser();
        if (alreadyLoggedIn != null) {
          // ignore: avoid_print
          print('[CometChatInit] ✓ User already logged in: ${alreadyLoggedIn.uid}');
          return const CometChatInitResult.success();
        }

        // Fetch auth token from DeskLine backend
        // ignore: avoid_print
        print('[CometChatInit] → Fetching auth token from backend (attempt ${attempt + 1})...');
        final response = await dioClient.dio.post(
          ApiEndpoints.cometchatAuthToken,
        );

        final authToken = response.data['authToken'] as String?;
        if (authToken == null || authToken.isEmpty) {
          throw Exception('Auth token not found in response');
        }
        // ignore: avoid_print
        print('[CometChatInit] → Auth token received, logging in to CometChat...');

        // Capture for Calls SDK login reuse
        _capturedAuthToken = authToken;

        // Login to CometChat with the auth token.
        // loginWithAuthToken is async internally (platform channel) — its
        // onSuccess/onError may fire AFTER the outer await returns. We use
        // a Completer with a 15 s timeout so a silent SDK hang doesn't block
        // the initializer forever.
        final loginCompleter = Completer<void>();
        CometChatException? loginError;

        await CometChatUIKit.loginWithAuthToken(
          authToken,
          onSuccess: (user) {
            // ignore: avoid_print
            print('[CometChatInit] ✓ loginWithAuthToken onSuccess: ${user.uid}');
            if (!loginCompleter.isCompleted) loginCompleter.complete();
          },
          onError: (e) {
            // ignore: avoid_print
            print('[CometChatInit] ✗ loginWithAuthToken onError: ${e.message}');
            loginError = e;
            if (!loginCompleter.isCompleted) loginCompleter.complete();
          },
        );

        // Wait for the callback with a timeout so we never hang indefinitely.
        await loginCompleter.future.timeout(
          const Duration(seconds: 15),
          onTimeout: () {
            // ignore: avoid_print
            print('[CometChatInit] ✗ loginWithAuthToken timed out after 15 s');
            // Don't throw — fall through so the retry loop can retry.
          },
        );

        if (loginCompleter.isCompleted && loginError == null) {
          return const CometChatInitResult.success();
        }

        if (loginError != null) {
          throw loginError!;
        }

        // Timed out — retry
        throw Exception('loginWithAuthToken timed out');
      } catch (e) {
        // ignore: avoid_print
        print('[CometChatInit] ✗ Login attempt ${attempt + 1} failed: $e');
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
