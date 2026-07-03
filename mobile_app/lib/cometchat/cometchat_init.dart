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
  /// [expectedUid] is the CometChat UID of the DeskLine user currently signing
  /// in (their DeskLine user id). It is used to detect and discard a persisted
  /// session that belongs to a *different* user (e.g. after logging out as one
  /// role and back in as another).
  Future<CometChatInitResult> initialize(
    DioClient dioClient, {
    String? expectedUid,
  }) async {
    // If already in progress or completed, return existing future
    if (_initCompleter != null) {
      return _initCompleter!.future;
    }

    _initCompleter = Completer<CometChatInitResult>();

    try {
      final result = await _performInitialization(dioClient, expectedUid);
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

  /// Fully log out of CometChat on user logout: tear down the persisted SDK
  /// session (so the next user doesn't inherit this identity) and reset the
  /// initializer so the next login runs a clean init + login.
  ///
  /// Best-effort — never throws.
  Future<void> logout() async {
    await _forceLogout();
    reset();
  }

  /// Performs SDK init + login with retry and exponential backoff.
  Future<CometChatInitResult> _performInitialization(
    DioClient dioClient,
    String? expectedUid,
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
    final loginResult = await _loginWithRetry(dioClient, expectedUid);
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

  /// Whether the native Calls SDK (WebRTC engine) is currently initialized.
  /// Guards against a double CometChatCalls.init() (init while still
  /// initialized), which crashes on physical iOS/Android hardware.
  ///
  /// Reset to false in [_forceLogout] because CometChat.logout() tears the
  /// Calls SDK down — so the next login must re-init it. It tracks the SDK's
  /// real state, not "did we ever init once".
  static bool _callsSdkInitialized = false;

  /// Initialize and login the v5 Calls SDK so voice/video calling works.
  ///
  /// The Calls SDK requires the core CometChat SDK to already be initialized —
  /// otherwise iOS throws "Please call the CometChat.init() method" when a call
  /// starts. This runs AFTER [_initSdkWithRetry] (core init) inside
  /// [_performInitialization], guaranteeing the correct order. It is NOT done
  /// at app startup in main.dart, where core init hasn't happened yet.
  ///
  /// The init step is guarded by [_callsSdkInitialized] so the native WebRTC
  /// engine is only initialized once, even though this method re-runs on every
  /// re-login (double-init crashes on physical hardware).
  Future<void> _initCallsSdk() async {
    try {
      await ensureCallsSdkInitialized();
      await _loginCallsSdkWithRetry();
    } catch (e) {
      // ignore: avoid_print
      print('[CometChat] Calls SDK init/login failed: $e');
    }
  }

  /// Ensure the native Calls SDK (WebRTC engine) is initialized exactly once.
  ///
  /// Safe to call from the call-start paths as a lazy safety net: if the
  /// login-time [_initCallsSdk] didn't run (e.g. init flow timing on iOS, where
  /// plugin channels register a run-loop turn late), this guarantees
  /// CometChatCalls.init() has run before joinSession/loginWithAuthToken, so a
  /// call never hits "Please call the CometChatCalls.init() method".
  ///
  /// Requires the core CometChat SDK to already be initialized — true once the
  /// user is logged in, which is always the case before a call can start.
  Future<void> ensureCallsSdkInitialized() async {
    if (_callsSdkInitialized) return;
    await _initCallsSdkWithRetry();
    _callsSdkInitialized = true;
    // ignore: avoid_print
    print('[CometChatInit] ✓ Calls SDK initialized (lazy)');
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

  /// Whether an error indicates the persisted auth token is no longer valid
  /// on the server (e.g. the user was deleted/recreated or tokens were
  /// rotated), meaning the local session must be recreated from scratch.
  static bool _isStaleTokenError(Object? e) {
    if (e is CometChatException) {
      if (e.code == 'AUTH_ERR_AUTH_TOKEN_NOT_FOUND') return true;
      final msg = e.message?.toLowerCase() ?? '';
      return msg.contains('auth token') && msg.contains('does not exist');
    }
    final s = e.toString().toLowerCase();
    return s.contains('auth_err_auth_token_not_found') ||
        (s.contains('auth token') && s.contains('does not exist'));
  }

  /// Validate a persisted session with a single authenticated server call.
  ///
  /// Returns true if the session/token is still accepted by the server, false
  /// if the server rejects it as stale. On any *other* error (network/offline)
  /// we optimistically return true so an offline launch keeps working with the
  /// cached session instead of needlessly logging the user out.
  Future<bool> _isPersistedSessionValid(String uid) async {
    final completer = Completer<bool>();
    await CometChat.getUser(
      uid,
      onSuccess: (_) {
        if (!completer.isCompleted) completer.complete(true);
      },
      onError: (e) {
        // Stale token -> invalid. Anything else (e.g. offline) -> assume valid.
        if (!completer.isCompleted) completer.complete(!_isStaleTokenError(e));
      },
    );
    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () => true,
    );
  }

  /// Clear the persisted CometChat session so the next login starts clean.
  /// Best-effort: never throws, so callers can always fall through to a fresh
  /// login afterwards.
  Future<void> _forceLogout() async {
    try {
      final completer = Completer<void>();
      await CometChat.logout(
        onSuccess: (_) {
          if (!completer.isCompleted) completer.complete();
        },
        onError: (_) {
          if (!completer.isCompleted) completer.complete();
        },
      );
      await completer.future.timeout(
        const Duration(seconds: 10),
        onTimeout: () {},
      );
    } catch (_) {
      // Ignore — a failed logout shouldn't block a re-login attempt.
    }
    _capturedAuthToken = null;
    // CometChat.logout() also tears down the native Calls SDK, so its previous
    // init is no longer valid. Clear the guard so the next login re-runs
    // CometChatCalls.init() via [ensureCallsSdkInitialized]. This is a
    // legitimate single init of a torn-down SDK — NOT the double-init (init
    // while still initialized) that crashes iOS. Without this reset, the flag
    // would wrongly report the SDK as ready and calls would fail with
    // "Please call the CometChatCalls.init() method" after the first logout.
    _callsSdkInitialized = false;
  }

  /// Fetch auth token from backend and login to CometChat with retry.
  Future<CometChatInitResult> _loginWithRetry(
    DioClient dioClient,
    String? expectedUid,
  ) async {
    for (int attempt = 0; attempt < _maxRetries; attempt++) {
      try {
        // Check if the user is already logged in (e.g. SDK persisted session).
        // If so, skip the login step — calling loginWithAuthToken again can
        // cause the SDK to hang without firing any callback.
        //
        // BUT two things can make a persisted session wrong:
        //  1. It may belong to a DIFFERENT DeskLine user — e.g. the previous
        //     user logged out and someone signed in with another account.
        //     CometChat persists its session natively (iOS Keychain, Android
        //     EncryptedSharedPreferences) and DeskLine logout doesn't always
        //     clear it (uninstall/crash), so the old identity can linger and
        //     make chat/calls act as the wrong user. The backend always uses
        //     the DeskLine user id as the CometChat UID, so we compare the
        //     persisted uid against [expectedUid] and re-auth on mismatch.
        //  2. The token may have been invalidated server-side (user deleted/
        //     recreated, tokens rotated). Trusting it blindly makes init report
        //     "success" while the socket later fails with
        //     AUTH_ERR_AUTH_TOKEN_NOT_FOUND. So we also validate the session
        //     against the server before trusting it.
        // In either case we log out + re-login fresh below.
        final alreadyLoggedIn = await CometChat.getLoggedInUser();
        if (alreadyLoggedIn != null) {
          if (expectedUid != null && alreadyLoggedIn.uid != expectedUid) {
            // ignore: avoid_print
            print('[CometChatInit] ⚠ Persisted session ${alreadyLoggedIn.uid} != current user $expectedUid; logging out to re-auth');
            await _forceLogout();
          } else {
            final sessionValid =
                await _isPersistedSessionValid(alreadyLoggedIn.uid);
            if (sessionValid) {
              // ignore: avoid_print
              print('[CometChatInit] ✓ User already logged in: ${alreadyLoggedIn.uid}');
              return const CometChatInitResult.success();
            }
            // Stale persisted session — clear it, then fall through to a fresh
            // token fetch + login below.
            // ignore: avoid_print
            print('[CometChatInit] ⚠ Stale session for ${alreadyLoggedIn.uid}; logging out to re-auth');
            await _forceLogout();
          }
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
        // If a stale/invalid token caused the failure, clear the persisted
        // session so the next attempt fetches and logs in with a fresh one.
        if (_isStaleTokenError(e)) {
          // ignore: avoid_print
          print('[CometChatInit] ⚠ Stale auth token; logging out before retry');
          await _forceLogout();
        }
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
