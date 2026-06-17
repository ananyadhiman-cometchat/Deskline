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
      limit: pageSize,
      role: role != null ? _roleToString(role) : null,
      department: department != null ? _departmentToString(department) : null,
      isActive: isActive?.toString(),
      search: search,
    );

    final json = response.data as Map<String, dynamic>;
    final dataList = json['data'] as List<dynamic>;
    final meta = json['meta'] as Map<String, dynamic>;

    return PaginatedResponse(
      data: dataList
          .map((item) => User.fromJson(item as Map<String, dynamic>))
          .toList(),
      meta: PaginationMeta(
        total: (meta['total'] as num?)?.toInt() ?? 0,
        page: (meta['page'] as num?)?.toInt() ?? page,
        pageSize: (meta['limit'] as num?)?.toInt() ?? pageSize,
        totalPages: (meta['totalPages'] as num?)?.toInt(),
      ),
    );
  }

  @override
  Future<User> getUserById(String id) async {
    final response = await getUsers(page: 1, pageSize: 1, search: id);
    if (response.data.isEmpty) {
      throw Exception('User not found');
    }
    return response.data.first;
  }

  @override
  Future<User> createUser({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  }) async {
    final data = <String, dynamic>{
      'name': name,
      'email': email,
      'password': password,
      'role': _roleToString(role),
      'department': _departmentToString(department),
    };

    final response = await _apiService.createUser(data);
    final json = response.data as Map<String, dynamic>;
    return User.fromJson(json['data'] as Map<String, dynamic>);
  }

  @override
  Future<User> updateUser({
    required String id,
    String? name,
    String? email,
    String? password,
    UserRole? role,
    Department? department,
    bool? isActive,
  }) async {
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (email != null) data['email'] = email;
    if (password != null) data['password'] = password;
    if (role != null) data['role'] = _roleToString(role);
    if (department != null) data['department'] = _departmentToString(department);
    if (isActive != null) data['isActive'] = isActive;

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
