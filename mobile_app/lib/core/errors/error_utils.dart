import 'package:dio/dio.dart';

import 'app_exception.dart';

/// Extracts a user-friendly error message from any exception.
///
/// Handles:
/// - [AppException] subtypes (from our Dio interceptor)
/// - [DioException] with wrapped [AppException]
/// - Generic exceptions
String getUserFriendlyError(Object error) {
  // DioException wrapping our AppException
  if (error is DioException && error.error is AppException) {
    return _appExceptionMessage(error.error as AppException);
  }

  // Direct AppException
  if (error is AppException) {
    return _appExceptionMessage(error);
  }

  // Raw DioException without our wrapper
  if (error is DioException) {
    return _dioExceptionMessage(error);
  }

  // Generic exception
  final message = error.toString();
  if (message.startsWith('Exception: ')) {
    return message.substring('Exception: '.length);
  }
  return message;
}

String _appExceptionMessage(AppException e) {
  switch (e) {
    case AuthException():
      return e.message;
    case ValidationException():
      return e.message;
    case PermissionException():
      return 'You do not have permission to perform this action.';
    case NotFoundException():
      return e.message;
    case NetworkException():
      return e.message;
    default:
      return e.message;
  }
}

String _dioExceptionMessage(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
      return 'Connection timed out. Please check your network.';
    case DioExceptionType.connectionError:
      return 'Unable to connect to server. Please check your network.';
    case DioExceptionType.badResponse:
      final statusCode = e.response?.statusCode;
      if (statusCode == 401) return 'Invalid credentials.';
      if (statusCode == 403) return 'Access denied.';
      if (statusCode == 404) return 'Resource not found.';
      if (statusCode != null && statusCode >= 500) {
        return 'Server error. Please try again later.';
      }
      return 'Request failed. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
