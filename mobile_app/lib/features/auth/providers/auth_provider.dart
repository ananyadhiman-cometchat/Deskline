import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/models.dart';
import '../../../shared/services/secure_storage_provider.dart';
import '../../../shared/services/secure_storage_service.dart';
import '../data/auth_repository.dart';
import '../data/api_auth_repository.dart';
import '../data/mock_auth_repository.dart';
import '../../../shared/services/environment_provider.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return ref.watch(dataSourceProvider)==DataSource.api
      ? ApiAuthRepository()
      : MockAuthRepository();
});

final authStateProvider =
    StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(secureStorageProvider),
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

  AuthStateNotifier(this._repository, this._secureStorage)
      : super(const AuthState()) {
    // Initialize auth state from storage
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      final userJson = await _secureStorage.getUser();
      if (userJson != null) {
        final user = User.fromJson(userJson);
        state = AuthState(
          user: user,
          isInitialized: true,
        );
      } else {
        state = state.copyWith(isInitialized: true);
      }
    } catch (e) {
      // If there's an error reading from storage, clear everything
      await _secureStorage.clearAll();
      state = const AuthState(isInitialized: true);
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response =
          await _repository.login(email: email, password: password);
      
      // Save tokens and user to secure storage
      await _secureStorage.saveToken(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      await _secureStorage.saveUser(response.user.toJson());
      
      state = AuthState(user: response.user);
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
      
      // Save tokens and user to secure storage
      await _secureStorage.saveToken(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      await _secureStorage.saveUser(response.user.toJson());
      
      state = AuthState(user: response.user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
      await _secureStorage.clearAll();
      state = const AuthState();
    } catch (e) {
      // Even if logout fails on server, clear local storage
      await _secureStorage.clearAll();
      state = const AuthState();
    }
  }

  Future<void> refreshAuthState() async {
    try {
      final userJson = await _secureStorage.getUser();
      if (userJson != null) {
        final user = User.fromJson(userJson);
        state = AuthState(user: user);
      } else {
        state = const AuthState();
      }
    } catch (e) {
      await _secureStorage.clearAll();
      state = const AuthState();
    }
  }

  void setUser(User user) {
    state = AuthState(user: user);
  }
}