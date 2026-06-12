import 'app_exception.dart';

/// Converts application exceptions to user-friendly error messages.
class ErrorHandler {
  const ErrorHandler._();

  /// Returns a user-friendly message for the given exception.
  static String getMessage(Object error) {
    if (error is AuthException) {
      return _authMessage(error);
    }
    if (error is ValidationException) {
      return error.message;
    }
    if (error is NotFoundException) {
      return 'The requested item could not be found.';
    }
    if (error is PermissionException) {
      return 'You do not have permission to perform this action.';
    }
    if (error is NetworkException) {
      return _networkMessage(error);
    }
    if (error is AppException) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  static String _authMessage(AuthException error) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Invalid email or password.';
      case 'token_expired':
        return 'Your session has expired. Please sign in again.';
      case 'account_disabled':
        return 'Your account has been disabled. Contact an administrator.';
      default:
        return error.message;
    }
  }

  static String _networkMessage(NetworkException error) {
    if (error.statusCode == null) {
      return 'No internet connection. Please check your network.';
    }
    switch (error.statusCode) {
      case 408:
        return 'Request timed out. Please try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return 'A network error occurred. Please try again.';
    }
  }
}
