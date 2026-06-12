import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  User? _currentUser;

  static final _mockUsers = [
    User(
      id: 'usr-001',
      name: 'Alice Employee',
      email: 'employee@deskline.com',
      role: UserRole.employee,
      department: Department.it,
      isActive: true,
      createdAt: DateTime(2025, 1, 15),
      updatedAt: DateTime(2025, 6, 1),
    ),
    User(
      id: 'usr-002',
      name: 'Bob Agent',
      email: 'agent@deskline.com',
      role: UserRole.agent,
      department: Department.it,
      isActive: true,
      createdAt: DateTime(2025, 1, 10),
      updatedAt: DateTime(2025, 6, 1),
    ),
    User(
      id: 'usr-003',
      name: 'Carol Supervisor',
      email: 'supervisor@deskline.com',
      role: UserRole.supervisor,
      department: Department.it,
      isActive: true,
      createdAt: DateTime(2025, 1, 5),
      updatedAt: DateTime(2025, 6, 1),
    ),
    User(
      id: 'usr-004',
      name: 'Dave Admin',
      email: 'admin@deskline.com',
      role: UserRole.admin,
      department: Department.general,
      isActive: true,
      createdAt: DateTime(2024, 12, 1),
      updatedAt: DateTime(2025, 6, 1),
    ),
  ];

  @override
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final user = _mockUsers.where((u) => u.email == email).firstOrNull;
    if (user == null) {
      throw Exception('Invalid credentials');
    }

    _currentUser = user;
    return AuthResponse(
      user: user,
      accessToken: 'mock-access-token-${user.id}',
      refreshToken: 'mock-refresh-token-${user.id}',
    );
  }

  @override
  Future<AuthResponse> register({
    required String name,
    required String email,
    required String password,
    required String department,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final newUser = User(
      id: 'usr-${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      email: email,
      role: UserRole.employee,
      department: Department.values.firstWhere(
        (d) => d.name == department.toLowerCase(),
        orElse: () => Department.general,
      ),
      isActive: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    _currentUser = newUser;
    return AuthResponse(
      user: newUser,
      accessToken: 'mock-access-token-${newUser.id}',
      refreshToken: 'mock-refresh-token-${newUser.id}',
    );
  }

  @override
  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _currentUser = null;
  }

  @override
  Future<User> getCurrentUser() async {
    await Future.delayed(const Duration(milliseconds: 300));

    if (_currentUser == null) {
      throw Exception('Not authenticated');
    }
    return _currentUser!;
  }
}
