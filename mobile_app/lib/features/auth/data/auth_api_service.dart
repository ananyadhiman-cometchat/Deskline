import 'package:dio/dio.dart';

import '../../../core/networking/api_endpoints.dart';
import '../../../core/networking/dio_client.dart';
import '../dto/login_request_dto.dart';
import '../dto/register_request_dto.dart';

class AuthApiService {
  final Dio _dio;

  AuthApiService(DioClient client) : _dio = client.dio;

  Future<Response> login(LoginRequestDto dto) {
    return _dio.post(ApiEndpoints.login, data: dto.toJson());
  }

  Future<Response> register(RegisterRequestDto dto) {
    return _dio.post(ApiEndpoints.register, data: dto.toJson());
  }

  Future<Response> logout(String refreshToken) {
    return _dio.post(ApiEndpoints.logout, data: {'refreshToken': refreshToken});
  }

  Future<Response> refresh(String refreshToken) {
    return _dio.post(
      ApiEndpoints.refreshToken,
      data: {'refreshToken': refreshToken},
    );
  }

  Future<Response> getCurrentUser() {
    return _dio.get(ApiEndpoints.currentUser);
  }
}
