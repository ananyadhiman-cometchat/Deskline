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

  Future<User> updateUser({
    required String id,
    String? name,
    UserRole? role,
    Department? department,
  });

  Future<void> deactivateUser(String id);
}
