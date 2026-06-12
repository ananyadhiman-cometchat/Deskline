import '../../../shared/models/models.dart';
import '../../../shared/services/secure_storage_service.dart';
import '../dto/login_request_dto.dart';
import '../dto/register_request_dto.dart';
import 'auth_api_service.dart';
import 'auth_repository.dart';

class ApiAuthRepository implements AuthRepository {
  final AuthApiService _apiService;
  final SecureStorageService _storage;

  ApiAuthRepository({
    required AuthApiService apiService,
    required SecureStorageService storage,
  })  : _apiService = apiService,
        _storage = storage;

  @override
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiService.login(
      LoginRequestDto(email: email, password: password),
    );

    // Backend returns { user, accessToken, refreshToken } at root level
    final data = response.data as Map<String, dynamic>;
    return AuthResponse.fromJson(data);
  }

  @override
  Future<AuthResponse> register({
    required String name,
    required String email,
    required String password,
    required String department,
  }) async {
    final response = await _apiService.register(
      RegisterRequestDto(
        name: name,
        email: email,
        password: password,
        department: department,
      ),
    );

    // Backend returns { user, accessToken, refreshToken } at root level
    final data = response.data as Map<String, dynamic>;
    return AuthResponse.fromJson(data);
  }

  @override
  Future<void> logout() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await _apiService.logout(refreshToken);
    }
  }

  @override
  Future<User> getCurrentUser() async {
    final response = await _apiService.getCurrentUser();

    // Backend returns { data: user }
    final data = response.data as Map<String, dynamic>;
    final userData = data['data'] as Map<String, dynamic>;
    return User.fromJson(userData);
  }
}
