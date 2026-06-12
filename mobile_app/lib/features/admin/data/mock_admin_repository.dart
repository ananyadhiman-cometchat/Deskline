import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'admin_repository.dart';

class MockAdminRepository implements AdminRepository {
  @override
  Future<User> createUser({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    return User(
      id: 'usr-${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      email: email,
      role: role,
      department: department,
      isActive: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  @override
  Future<PaginatedResponse<ActivityLog>> getActivityLogs({
    int page = 1,
    int pageSize = 10,
    String? userId,
    String? action,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    var logs = List<ActivityLog>.from(_mockActivityLogs);

    if (userId != null) {
      logs = logs.where((l) => l.userId == userId).toList();
    }
    if (action != null && action.isNotEmpty) {
      logs = logs.where((l) => l.action == action).toList();
    }

    final total = logs.length;
    final start = (page - 1) * pageSize;
    final end = start + pageSize > total ? total : start + pageSize;
    final paged =
        start < total ? logs.sublist(start, end) : <ActivityLog>[];

    return PaginatedResponse(
      data: paged,
      meta: PaginationMeta(total: total, page: page, pageSize: pageSize),
    );
  }

  @override
  Future<PaginatedResponse<AppNotification>> getNotificationLogs({
    int page = 1,
    int pageSize = 10,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final total = _mockNotificationLogs.length;
    final start = (page - 1) * pageSize;
    final end = start + pageSize > total ? total : start + pageSize;
    final paged = start < total
        ? _mockNotificationLogs.sublist(start, end)
        : <AppNotification>[];

    return PaginatedResponse(
      data: paged,
      meta: PaginationMeta(total: total, page: page, pageSize: pageSize),
    );
  }

  @override
  Future<TicketAnalytics> getTicketAnalytics() async {
    await Future.delayed(const Duration(milliseconds: 500));

    return const TicketAnalytics(
      totalTickets: 21,
      activeTickets: 12,
      resolvedTickets: 5,
      escalatedTickets: 3,
      totalUsers: 16,
      byCategory: {'IT': 10, 'HR': 6, 'General': 5},
      byStatus: {
        'open': 7,
        'in_progress': 4,
        'escalated': 3,
        'resolved': 4,
        'closed': 3,
      },
      byDepartment: {'IT': 8, 'HR': 5, 'General': 3},
    );
  }

  @override
  Future<List<AgentWorkload>> getAgentWorkload() async {
    await Future.delayed(const Duration(milliseconds: 500));

    return [
      const AgentWorkload(
        userId: 'usr-002',
        name: 'Bob Agent',
        department: Department.it,
        openCount: 3,
        inProgressCount: 4,
        resolvedCount: 5,
      ),
      const AgentWorkload(
        userId: 'usr-006',
        name: 'Frank HR Agent',
        department: Department.hr,
        openCount: 1,
        inProgressCount: 1,
        resolvedCount: 4,
      ),
    ];
  }

  static final _mockActivityLogs = [
    ActivityLog(
      id: 'log-001',
      userId: 'usr-004',
      action: 'user.created',
      entityType: 'User',
      entityId: 'usr-015',
      metadata: {'name': 'Olivia Moore', 'role': 'employee'},
      createdAt: DateTime(2026, 5, 20, 10, 0),
    ),
    ActivityLog(
      id: 'log-002',
      userId: 'usr-002',
      action: 'ticket.status_changed',
      entityType: 'Ticket',
      entityId: 'tkt-002',
      metadata: {'from': 'open', 'to': 'in_progress'},
      createdAt: DateTime(2026, 6, 3, 9, 30),
    ),
    ActivityLog(
      id: 'log-003',
      userId: 'usr-003',
      action: 'ticket.escalated',
      entityType: 'Ticket',
      entityId: 'tkt-005',
      metadata: {'reason': 'License expiry urgent'},
      createdAt: DateTime(2026, 6, 7, 14, 0),
    ),
    ActivityLog(
      id: 'log-004',
      userId: 'usr-004',
      action: 'user.deactivated',
      entityType: 'User',
      entityId: 'usr-012',
      metadata: {'name': 'Liam Taylor'},
      createdAt: DateTime(2026, 6, 1, 11, 0),
    ),
    ActivityLog(
      id: 'log-005',
      userId: 'usr-002',
      action: 'ticket.assigned',
      entityType: 'Ticket',
      entityId: 'tkt-015',
      metadata: {'agent': 'Bob Agent'},
      createdAt: DateTime(2026, 6, 10, 9, 15),
    ),
    ActivityLog(
      id: 'log-006',
      userId: 'usr-006',
      action: 'ticket.resolved',
      entityType: 'Ticket',
      entityId: 'tkt-003',
      metadata: {'resolution': 'Provided policy document link'},
      createdAt: DateTime(2026, 5, 28, 16, 30),
    ),
    ActivityLog(
      id: 'log-007',
      userId: 'usr-001',
      action: 'ticket.created',
      entityType: 'Ticket',
      entityId: 'tkt-001',
      metadata: {'title': 'Laptop not booting'},
      createdAt: DateTime(2026, 6, 1, 8, 0),
    ),
    ActivityLog(
      id: 'log-008',
      userId: 'usr-004',
      action: 'user.role_changed',
      entityType: 'User',
      entityId: 'usr-003',
      metadata: {'from': 'agent', 'to': 'supervisor'},
      createdAt: DateTime(2025, 12, 15, 10, 0),
    ),
    ActivityLog(
      id: 'log-009',
      userId: 'usr-002',
      action: 'ticket.reassigned',
      entityType: 'Ticket',
      entityId: 'tkt-009',
      metadata: {'from': 'usr-002', 'to': 'usr-006'},
      createdAt: DateTime(2026, 6, 8, 11, 45),
    ),
    ActivityLog(
      id: 'log-010',
      userId: 'usr-004',
      action: 'system.maintenance',
      entityType: 'System',
      entityId: 'sys-001',
      metadata: {'window': 'Saturday 2AM-6AM'},
      createdAt: DateTime(2026, 6, 8, 9, 0),
    ),
    ActivityLog(
      id: 'log-011',
      userId: 'usr-002',
      action: 'ticket.status_changed',
      entityType: 'Ticket',
      entityId: 'tkt-013',
      metadata: {'from': 'in_progress', 'to': 'resolved'},
      createdAt: DateTime(2026, 6, 5, 15, 0),
    ),
    ActivityLog(
      id: 'log-012',
      userId: 'usr-006',
      action: 'ticket.closed',
      entityType: 'Ticket',
      entityId: 'tkt-006',
      metadata: {'reason': 'Information provided'},
      createdAt: DateTime(2026, 5, 20, 14, 0),
    ),
  ];

  static final _mockNotificationLogs = [
    AppNotification(
      id: 'notif-001',
      userId: 'usr-001',
      type: NotificationType.ticketUpdate,
      title: 'Ticket Updated',
      body: 'Your ticket "Laptop not booting" has been assigned.',
      isRead: false,
      createdAt: DateTime(2026, 6, 11, 9, 30),
    ),
    AppNotification(
      id: 'notif-002',
      userId: 'usr-002',
      type: NotificationType.assignment,
      title: 'New Assignment',
      body: 'You have been assigned ticket "VPN access request".',
      isRead: true,
      createdAt: DateTime(2026, 6, 10, 14, 0),
    ),
    AppNotification(
      id: 'notif-003',
      userId: 'usr-003',
      type: NotificationType.escalation,
      title: 'Ticket Escalated',
      body: 'Ticket "Payslip discrepancy" has been escalated.',
      isRead: false,
      createdAt: DateTime(2026, 6, 9, 16, 45),
    ),
    AppNotification(
      id: 'notif-004',
      userId: 'usr-004',
      type: NotificationType.announcement,
      title: 'System Maintenance',
      body: 'Scheduled maintenance this Saturday.',
      isRead: true,
      createdAt: DateTime(2026, 6, 8, 9, 0),
    ),
    AppNotification(
      id: 'notif-005',
      userId: 'usr-001',
      type: NotificationType.ticketUpdate,
      title: 'Ticket Resolved',
      body: 'Your ticket "2FA setup" has been resolved.',
      isRead: true,
      createdAt: DateTime(2026, 6, 5, 11, 0),
    ),
  ];
}
