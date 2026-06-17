import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';

abstract class UserRepository {
  Future<PaginatedResponse<User>> getUsers({
    int page = 1,
    int pageSize = 10,
    UserRole? role,
    Department? department,
    bool? isActive,
    String? search,
  });

  Future<User> getUserById(String id);

  Future<User> createUser({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  });

  Future<User> updateUser({
    required String id,
    String? name,
    String? email,
    String? password,
    UserRole? role,
    Department? department,
    bool? isActive,
  });

  Future<void> deactivateUser(String id);
}
