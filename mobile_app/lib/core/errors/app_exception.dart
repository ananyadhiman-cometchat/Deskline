/// Base exception class for the DeskLine application.
class AppException implements Exception {
  final String message;
  final String? code;

  const AppException(this.message, {this.code});

  @override
  String toString() => 'AppException: $message';
}

/// Thrown when authentication fails (invalid credentials, expired token, etc.).
class AuthException extends AppException {
  const AuthException(super.message, {super.code});

  @override
  String toString() => 'AuthException: $message';
}

/// Thrown when input validation fails.
class ValidationException extends AppException {
  final Map<String, String>? fieldErrors;

  const ValidationException(super.message, {super.code, this.fieldErrors});

  @override
  String toString() => 'ValidationException: $message';
}

/// Thrown when a requested resource is not found.
class NotFoundException extends AppException {
  const NotFoundException(super.message, {super.code});

  @override
  String toString() => 'NotFoundException: $message';
}

/// Thrown when the user does not have permission to perform an action.
class PermissionException extends AppException {
  const PermissionException(super.message, {super.code});

  @override
  String toString() => 'PermissionException: $message';
}

/// Thrown when a network request fails (timeout, no internet, etc.).
class NetworkException extends AppException {
  final int? statusCode;

  const NetworkException(super.message, {super.code, this.statusCode});

  @override
  String toString() => 'NetworkException: $message (status: $statusCode)';
}
