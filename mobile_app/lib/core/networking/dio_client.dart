import 'package:dio/dio.dart';

import '../../shared/services/secure_storage_service.dart';
import '../errors/app_exception.dart';
import 'api_endpoints.dart';

/// Configured Dio client with auth token injection and automatic refresh.
class DioClient {
  late final Dio _dio;
  final SecureStorageService _storage;

  /// Callback invoked when a refresh attempt fails (e.g. expired session).
  /// The app should clear state and navigate to login.
  final Future<void> Function()? onSessionExpired;

  bool _isRefreshing = false;

  DioClient(
    this._storage, {
    this.onSessionExpired,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _onRequest,
        onError: _onError,
      ),
    );
  }

  Dio get dio => _dio;

  /// Inject Bearer token into every outgoing request (except auth endpoints).
  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip token injection for login, register, and refresh endpoints
    final path = options.path;
    if (_isPublicEndpoint(path)) {
      handler.next(options);
      return;
    }

    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  /// Handle errors — attempt token refresh on 401, map others to AppExceptions.
  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = error.response?.statusCode;

    // Attempt refresh on 401 (Unauthorized), but not for auth endpoints
    if (statusCode == 401 && !_isPublicEndpoint(error.requestOptions.path)) {
      final retried = await _attemptRefreshAndRetry(error);
      if (retried != null) {
        handler.resolve(retried);
        return;
      }
    }

    // Map to typed exceptions
    handler.reject(
      DioException(
        requestOptions: error.requestOptions,
        response: error.response,
        error: _mapToAppException(error),
      ),
    );
  }

  /// Try to refresh the token and retry the original request.
  /// Returns the successful response or null if refresh failed.
  Future<Response?> _attemptRefreshAndRetry(DioException error) async {
    if (_isRefreshing) return null;
    _isRefreshing = true;

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        await _handleSessionExpired();
        return null;
      }

      // Use a separate Dio instance to avoid interceptor recursion
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: ApiEndpoints.baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      final response = await refreshDio.post(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200 && response.data != null) {
        final newAccessToken = response.data['accessToken'] as String?;
        final newRefreshToken = response.data['refreshToken'] as String?;

        if (newAccessToken != null && newRefreshToken != null) {
          await _storage.saveToken(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );

          // Retry original request with new token
          final opts = error.requestOptions;
          opts.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResponse = await _dio.fetch(opts);
          return retryResponse;
        }
      }

      await _handleSessionExpired();
      return null;
    } on DioException {
      await _handleSessionExpired();
      return null;
    } finally {
      _isRefreshing = false;
    }
  }

  Future<void> _handleSessionExpired() async {
    await _storage.clearAll();
    onSessionExpired?.call();
  }

  bool _isPublicEndpoint(String path) {
    return path == ApiEndpoints.login ||
        path == ApiEndpoints.register ||
        path == ApiEndpoints.refreshToken ||
        path == ApiEndpoints.logout;
  }

  /// Maps a DioException to a typed AppException based on status code and
  /// backend error response shape: { error: { code, message } } or { message }.
  AppException _mapToAppException(DioException error) {
    final statusCode = error.response?.statusCode;
    final data = error.response?.data;

    String message = error.message ?? 'An unexpected error occurred';
    String? code;

    // Try to extract backend error message
    if (data is Map<String, dynamic>) {
      if (data.containsKey('error') && data['error'] is Map) {
        final errorMap = data['error'] as Map<String, dynamic>;
        message = errorMap['message'] as String? ?? message;
        code = errorMap['code'] as String?;
      } else if (data.containsKey('message')) {
        message = data['message'] as String? ?? message;
      }
    }

    switch (statusCode) {
      case 400:
        return ValidationException(message, code: code);
      case 401:
        return AuthException(message, code: code);
      case 403:
        return PermissionException(message, code: code);
      case 404:
        return NotFoundException(message, code: code);
      default:
        if (error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            error.type == DioExceptionType.sendTimeout) {
          return const NetworkException(
            'Connection timed out. Please check your network.',
          );
        }
        if (error.type == DioExceptionType.connectionError) {
          return const NetworkException(
            'Unable to connect to server. Please check your network.',
          );
        }
        return NetworkException(message, statusCode: statusCode);
    }
  }
}
