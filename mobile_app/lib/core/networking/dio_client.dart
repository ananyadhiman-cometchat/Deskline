import 'package:dio/dio.dart';

import 'api_endpoints.dart';

/// Stub Dio client with base configuration.
/// Interceptors for auth token injection and refresh will be added in Phase 2.
class DioClient {
  late final Dio _dio;

  DioClient() {
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

    // Placeholder for interceptors (auth, logging, error mapping)
    // Will be implemented in Phase 2 when connecting to real backend.
  }

  Dio get dio => _dio;
}
