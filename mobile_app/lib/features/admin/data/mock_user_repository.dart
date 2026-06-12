import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'user_repository.dart';

class MockUserRepository implements UserRepository {
  final List<User> _users = List.from(_mockUsers);

  static final _mockUsers = [
    User(id: 'usr-001', name: 'Alice Employee', email: 'alice@deskline.com', role: UserRole.employee, department: Department.it, isActive: true, createdAt: DateTime(2025, 1, 15), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-002', name: 'Bob Agent', email: 'bob@deskline.com', role: UserRole.agent, department: Department.it, isActive: true, createdAt: DateTime(2025, 1, 10), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-003', name: 'Carol Supervisor', email: 'carol@deskline.com', role: UserRole.supervisor, department: Department.it, isActive: true, createdAt: DateTime(2025, 1, 5), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-004', name: 'Dave Admin', email: 'dave@deskline.com', role: UserRole.admin, department: Department.general, isActive: true, createdAt: DateTime(2024, 12, 1), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-005', name: 'Eve Johnson', email: 'eve@deskline.com', role: UserRole.employee, department: Department.hr, isActive: true, createdAt: DateTime(2025, 2, 1), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-006', name: 'Frank HR Agent', email: 'frank@deskline.com', role: UserRole.agent, department: Department.hr, isActive: true, createdAt: DateTime(2025, 2, 10), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-007', name: 'Grace Williams', email: 'grace@deskline.com', role: UserRole.employee, department: Department.general, isActive: true, createdAt: DateTime(2025, 3, 1), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-008', name: 'Henry Chen', email: 'henry@deskline.com', role: UserRole.employee, department: Department.it, isActive: true, createdAt: DateTime(2025, 3, 15), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-009', name: 'Irene Davis', email: 'irene@deskline.com', role: UserRole.employee, department: Department.hr, isActive: true, createdAt: DateTime(2025, 4, 1), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-010', name: 'Jack Brown', email: 'jack@deskline.com', role: UserRole.employee, department: Department.it, isActive: true, createdAt: DateTime(2025, 4, 10), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-011', name: 'Kate Miller', email: 'kate@deskline.com', role: UserRole.employee, department: Department.general, isActive: true, createdAt: DateTime(2025, 4, 20), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-012', name: 'Liam Taylor', email: 'liam@deskline.com', role: UserRole.employee, department: Department.hr, isActive: false, createdAt: DateTime(2025, 5, 1), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-013', name: 'Mia Anderson', email: 'mia@deskline.com', role: UserRole.employee, department: Department.it, isActive: true, createdAt: DateTime(2025, 5, 10), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-014', name: 'Noah Wilson', email: 'noah@deskline.com', role: UserRole.employee, department: Department.general, isActive: true, createdAt: DateTime(2025, 5, 15), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-015', name: 'Olivia Moore', email: 'olivia@deskline.com', role: UserRole.employee, department: Department.it, isActive: true, createdAt: DateTime(2025, 5, 20), updatedAt: DateTime(2025, 6, 1)),
    User(id: 'usr-016', name: 'Paul Supervisor', email: 'paul@deskline.com', role: UserRole.supervisor, department: Department.hr, isActive: true, createdAt: DateTime(2025, 1, 8), updatedAt: DateTime(2025, 6, 1)),
  ];

  @override
  Future<PaginatedResponse<User>> getUsers({
    int page = 1,
    int pageSize = 10,
    UserRole? role,
    Department? department,
    bool? isActive,
    String? search,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    var filtered = List<User>.from(_users);

    if (role != null) {
      filtered = filtered.where((u) => u.role == role).toList();
    }
    if (department != null) {
      filtered = filtered.where((u) => u.department == department).toList();
    }
    if (isActive != null) {
      filtered = filtered.where((u) => u.isActive == isActive).toList();
    }
    if (search != null && search.isNotEmpty) {
      final query = search.toLowerCase();
      filtered = filtered
          .where(
            (u) =>
                u.name.toLowerCase().contains(query) ||
                u.email.toLowerCase().contains(query),
          )
          .toList();
    }

    final total = filtered.length;
    final start = (page - 1) * pageSize;
    final end = start + pageSize > total ? total : start + pageSize;
    final paged = start < total ? filtered.sublist(start, end) : <User>[];

    return PaginatedResponse(
      data: paged,
      meta: PaginationMeta(total: total, page: page, pageSize: pageSize),
    );
  }

  @override
  Future<User> getUserById(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return _users.firstWhere(
      (u) => u.id == id,
      orElse: () => throw Exception('User not found'),
    );
  }

  @override
  Future<User> updateUser({
    required String id,
    String? name,
    UserRole? role,
    Department? department,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final index = _users.indexWhere((u) => u.id == id);
    if (index == -1) throw Exception('User not found');

    final updated = _users[index].copyWith(
      name: name ?? _users[index].name,
      role: role ?? _users[index].role,
      department: department ?? _users[index].department,
      updatedAt: DateTime.now(),
    );
    _users[index] = updated;
    return updated;
  }

  @override
  Future<void> deactivateUser(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final index = _users.indexWhere((u) => u.id == id);
    if (index == -1) throw Exception('User not found');

    _users[index] = _users[index].copyWith(
      isActive: false,
      updatedAt: DateTime.now(),
    );
  }
}
