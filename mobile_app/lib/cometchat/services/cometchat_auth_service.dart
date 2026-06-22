import 'package:dio/dio.dart';

import '../../core/networking/api_endpoints.dart';
import '../../core/networking/dio_client.dart';

/// Service responsible for fetching CometChat auth tokens from the backend.
///
/// The backend generates tokens server-side using the CometChat REST API Key,
/// ensuring no CometChat credentials are exposed to the client.
class CometChatAuthService {
  final DioClient _dioClient;

  CometChatAuthService(this._dioClient);

  /// Fetches a CometChat auth token from the backend.
  ///
  /// The backend endpoint `POST /api/cometchat/auth-token` uses the
  /// authenticated user's JWT to identify the user and generate
  /// a CometChat auth token using their DeskLine UUID as the CometChat UID.
  ///
  /// Returns the auth token string on success.
  /// Throws on network errors or if the backend returns a non-200 status.
  Future<String> fetchAuthToken() async {
    try {
      final response = await _dioClient.dio.post(
        ApiEndpoints.cometchatAuthToken,
      );

      final data = response.data as Map<String, dynamic>;
      final authToken = data['authToken'] as String?;

      if (authToken == null || authToken.isEmpty) {
        throw CometChatAuthException(
          'Backend returned empty auth token',
          statusCode: response.statusCode,
        );
      }

      return authToken;
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;

      // 503 means CometChat is temporarily unavailable
      if (statusCode == 503) {
        throw CometChatAuthException(
          'Chat service temporarily unavailable',
          statusCode: statusCode,
          isRetryable: true,
        );
      }

      throw CometChatAuthException(
        'Failed to fetch CometChat auth token: ${e.message}',
        statusCode: statusCode,
        isRetryable: statusCode == null || statusCode >= 500,
      );
    }
  }
}

/// Exception thrown when CometChat auth token generation fails.
class CometChatAuthException implements Exception {
  final String message;
  final int? statusCode;
  final bool isRetryable;

  CometChatAuthException(
    this.message, {
    this.statusCode,
    this.isRetryable = false,
  });

  @override
  String toString() => 'CometChatAuthException: $message (status: $statusCode)';
}
