// ignore_for_file: dangling_library_doc_comments
/// @deprecated Use [ApiEndpoints] from core/networking/api_endpoints.dart instead.
/// This file is kept for backward compatibility during migration.
export '../../../core/networking/api_endpoints.dart';

class ApiConstants {
  static const String baseUrl = 'http://10.0.2.2:4000/api';
  static const String tickets = '/tickets';
  static const String auth = '/auth';
}

class UserApiConstants {
  static const String fcmToken = '/users/me/fcm-token';
}
