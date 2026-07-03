import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/dio_client.dart';
import '../../../core/networking/dio_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/services/secure_storage_provider.dart';
import '../../../shared/services/secure_storage_service.dart';
import '../../../shared/services/environment_provider.dart';
import '../../../cometchat/providers/cometchat_provider.dart';
import '../../notifications/services/push_notification_service.dart';
import '../data/auth_api_service.dart';
import '../data/auth_repository.dart';
import '../data/api_auth_repository.dart';
import '../data/mock_auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (ref.watch(dataSourceProvider) == DataSource.api) {
    final dioClient = ref.watch(dioClientProvider);
    final storage = ref.watch(secureStorageProvider);
    return ApiAuthRepository(
      apiService: AuthApiService(dioClient),
      storage: storage,
    );
  }
  return MockAuthRepository();
});

final authStateProvider =
    StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AuthStateNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(secureStorageProvider),
    dioClient,
    ref,
  );
});

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  final bool isInitialized;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isInitialized = false,
  });

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
    bool? isInitialized,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }

  bool get isAuthenticated => user != null;
}

class AuthStateNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final SecureStorageService _secureStorage;
  final DioClient _dioClient;
  final Ref _ref;

  AuthStateNotifier(
    this._repository,
    this._secureStorage,
    this._dioClient,
    this._ref,
  ) : super(const AuthState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      final userJson = await _secureStorage.getUser();
      if (userJson != null) {
        final user = User.fromJson(userJson);
        state = AuthState(user: user, isInitialized: true);

        // Register FCM token on app resume with existing session
        _registerFcmToken();
      } else {
        state = state.copyWith(isInitialized: true);
      }
    } catch (e) {
      await _secureStorage.clearAll();
      state = const AuthState(isInitialized: true);
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response =
          await _repository.login(email: email, password: password);

      await _secureStorage.saveToken(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      await _secureStorage.saveUser(response.user.toJson());

      state = AuthState(user: response.user, isInitialized: true);

      // Register FCM token after successful login
      _registerFcmToken();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String department,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _repository.register(
        name: name,
        email: email,
        password: password,
        department: department,
      );

      await _secureStorage.saveToken(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      await _secureStorage.saveUser(response.user.toJson());

      state = AuthState(user: response.user, isInitialized: true);

      // Register FCM token after successful registration
      _registerFcmToken();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
    } catch (_) {
      // Even if server logout fails, proceed with local cleanup
    }
    // Tear down the CometChat session too. Without this the CometChat SDK
    // keeps this user's natively-persisted session, so the next user who logs
    // in on this device inherits their chat/call identity.
    try {
      await _ref.read(cometchatProvider.notifier).reset();
    } catch (_) {
      // Best-effort — never block logout on chat cleanup.
    }
    await _secureStorage.clearAll();
    state = const AuthState(isInitialized: true);
  }

  Future<void> refreshAuthState() async {
    try {
      final userJson = await _secureStorage.getUser();
      if (userJson != null) {
        final user = User.fromJson(userJson);
        state = AuthState(user: user, isInitialized: true);
      } else {
        state = const AuthState(isInitialized: true);
      }
    } catch (e) {
      await _secureStorage.clearAll();
      state = const AuthState(isInitialized: true);
    }
  }

  void setUser(User user) {
    state = AuthState(user: user, isInitialized: true);
  }

  /// Fire-and-forget FCM token registration
  void _registerFcmToken() {
    PushNotificationService.registerToken(_dioClient);
  }
}
