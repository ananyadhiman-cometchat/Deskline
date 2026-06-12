import '../../../core/networking/dio_client.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'admin_api_service.dart';
import 'user_repository.dart';

class ApiUserRepository implements UserRepository {
  final AdminApiService _apiService;

  ApiUserRepository({required DioClient dioClient})
      : _apiService = AdminApiService(dioClient);

  @override
  Future<PaginatedResponse<User>> getUsers({
    int page = 1,
    int pageSize = 10,
    UserRole? role,
    Department? department,
    bool? isActive,
    String? search,
  }) async {
    final response = await _apiService.getUsers(
      page: page,
      pageSize: pageSize,
      role: role != null ? _roleToString(role) : null,
      department: department != null ? _departmentToString(department) : null,
      isActive: isActive?.toString(),
      search: search,
    );

    // Backend returns { data: [...], meta: { total, page, pageSize, ... } }
    final json = response.data as Map<String, dynamic>;
    return PaginatedResponse.fromJson(
      json,
      (item) => User.fromJson(item),
    );
  }

  @override
  Future<User> getUserById(String id) async {
    // Use the users list with a filter — backend doesn't have a single-user GET
    final response = await getUsers(page: 1, pageSize: 1, search: id);
    if (response.data.isEmpty) {
      throw Exception('User not found');
    }
    return response.data.first;
  }

  @override
  Future<User> updateUser({
    required String id,
    String? name,
    UserRole? role,
    Department? department,
  }) async {
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (role != null) data['role'] = _roleToString(role);
    if (department != null) data['department'] = _departmentToString(department);

    final response = await _apiService.updateUser(id, data);
    final json = response.data as Map<String, dynamic>;
    return User.fromJson(json['data'] as Map<String, dynamic>);
  }

  @override
  Future<void> deactivateUser(String id) async {
    await _apiService.deactivateUser(id);
  }

  // ── Helpers ─────────────────────────────────────────────────────

  String _roleToString(UserRole role) {
    switch (role) {
      case UserRole.employee:
        return 'employee';
      case UserRole.agent:
        return 'agent';
      case UserRole.supervisor:
        return 'supervisor';
      case UserRole.admin:
        return 'admin';
    }
  }

  String _departmentToString(Department department) {
    switch (department) {
      case Department.it:
        return 'IT';
      case Department.hr:
        return 'HR';
      case Department.general:
        return 'General';
    }
  }
}
