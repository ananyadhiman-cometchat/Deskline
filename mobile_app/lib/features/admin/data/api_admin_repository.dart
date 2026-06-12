import '../../../core/networking/dio_client.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'admin_api_service.dart';
import 'admin_repository.dart';

class ApiAdminRepository implements AdminRepository {
  final AdminApiService _apiService;

  ApiAdminRepository({required DioClient dioClient})
      : _apiService = AdminApiService(dioClient);

  @override
  Future<User> createUser({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  }) async {
    final response = await _apiService.createUser({
      'name': name,
      'email': email,
      'password': password,
      'role': _roleToString(role),
      'department': _departmentToString(department),
    });

    final data = response.data as Map<String, dynamic>;
    return User.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<PaginatedResponse<ActivityLog>> getActivityLogs({
    int page = 1,
    int pageSize = 10,
    String? userId,
    String? action,
  }) async {
    final response = await _apiService.getActivityLogs(
      page: page,
      pageSize: pageSize,
      userId: userId,
      action: action,
    );

    final json = response.data as Map<String, dynamic>;
    return PaginatedResponse.fromJson(
      json,
      (item) => ActivityLog.fromJson(item),
    );
  }

  @override
  Future<PaginatedResponse<AppNotification>> getNotificationLogs({
    int page = 1,
    int pageSize = 10,
  }) async {
    final response = await _apiService.getNotificationLogs(
      page: page,
      pageSize: pageSize,
    );

    final json = response.data as Map<String, dynamic>;
    return PaginatedResponse.fromJson(
      json,
      (item) => AppNotification.fromJson(item),
    );
  }

  @override
  Future<TicketAnalytics> getTicketAnalytics() async {
    final response = await _apiService.getDashboard();

    // Backend returns { data: { totals, usersByRole, ticketsByStatus, ... } }
    final json = response.data as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final totals = data['totals'] as Map<String, dynamic>;

    // Transform backend grouped data into the TicketAnalytics model
    final ticketsByStatus = <String, int>{};
    if (data['ticketsByStatus'] is List) {
      for (final item in data['ticketsByStatus'] as List) {
        final map = item as Map<String, dynamic>;
        ticketsByStatus[map['status'] as String] =
            (map['_count']?['status'] as int?) ?? 0;
      }
    }

    final ticketsByDepartment = <String, int>{};
    if (data['ticketsByDepartment'] is List) {
      for (final item in data['ticketsByDepartment'] as List) {
        final map = item as Map<String, dynamic>;
        ticketsByDepartment[map['category'] as String] =
            (map['_count']?['category'] as int?) ?? 0;
      }
    }

    final ticketsByPriority = <String, int>{};
    if (data['ticketsByPriority'] is List) {
      for (final item in data['ticketsByPriority'] as List) {
        final map = item as Map<String, dynamic>;
        ticketsByPriority[map['priority'] as String] =
            (map['_count']?['priority'] as int?) ?? 0;
      }
    }

    return TicketAnalytics(
      totalTickets: (totals['tickets'] as int?) ?? 0,
      activeTickets: (ticketsByStatus['open'] ?? 0) +
          (ticketsByStatus['in_progress'] ?? 0),
      resolvedTickets: (totals['resolvedToday'] as int?) ??
          (ticketsByStatus['resolved'] ?? 0),
      escalatedTickets: ticketsByStatus['escalated'] ?? 0,
      totalUsers: (totals['users'] as int?) ?? 0,
      byCategory: ticketsByDepartment,
      byStatus: ticketsByStatus,
      byDepartment: ticketsByDepartment,
    );
  }

  @override
  Future<List<AgentWorkload>> getAgentWorkload() async {
    final response = await _apiService.getAgentLoad();

    // Backend returns { data: [...], meta: { total } }
    final json = response.data as Map<String, dynamic>;
    final dataList = json['data'] as List<dynamic>;

    return dataList.map((item) {
      final map = item as Map<String, dynamic>;
      final ticketCount = (map['_count']?['assignedTickets'] as int?) ?? 0;

      return AgentWorkload(
        userId: map['id'] as String,
        name: map['name'] as String,
        department: _parseDepartment(map['department'] as String),
        openCount: ticketCount,
        inProgressCount: 0, // Backend doesn't break down by status yet
        resolvedCount: 0,
      );
    }).toList();
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

  Department _parseDepartment(String value) {
    switch (value) {
      case 'IT':
        return Department.it;
      case 'HR':
        return Department.hr;
      default:
        return Department.general;
    }
  }
}
