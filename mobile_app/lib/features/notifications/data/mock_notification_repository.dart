import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'notification_repository.dart';

class MockNotificationRepository implements NotificationRepository {
  final List<AppNotification> _notifications = List.from(_mockNotifications);

  static final _mockNotifications = [
    AppNotification(
      id: 'notif-001',
      userId: 'usr-001',
      type: NotificationType.ticketUpdate,
      title: 'Ticket Updated',
      body: 'Your ticket "Laptop not booting" has been assigned to an agent.',
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
      body: 'Ticket "Payslip discrepancy" has been escalated to you.',
      isRead: false,
      createdAt: DateTime(2026, 6, 9, 16, 45),
    ),
    AppNotification(
      id: 'notif-004',
      userId: 'usr-001',
      type: NotificationType.ticketUpdate,
      title: 'Ticket Resolved',
      body: 'Your ticket "Two-factor authentication setup" has been resolved.',
      isRead: true,
      createdAt: DateTime(2026, 6, 5, 11, 0),
    ),
    AppNotification(
      id: 'notif-005',
      userId: 'usr-004',
      type: NotificationType.announcement,
      title: 'System Maintenance',
      body: 'Scheduled maintenance window this Saturday 2AM-6AM.',
      isRead: false,
      createdAt: DateTime(2026, 6, 8, 9, 0),
    ),
    AppNotification(
      id: 'notif-006',
      userId: 'usr-002',
      type: NotificationType.escalation,
      title: 'Ticket Escalated',
      body: 'Ticket "Network outage on 5th floor" has been escalated.',
      isRead: false,
      createdAt: DateTime(2026, 6, 11, 8, 15),
    ),
    AppNotification(
      id: 'notif-007',
      userId: 'usr-001',
      type: NotificationType.ticketUpdate,
      title: 'Comment Added',
      body: 'Agent Bob added a comment on "Email not syncing on phone".',
      isRead: false,
      createdAt: DateTime(2026, 6, 8, 10, 30),
    ),
    AppNotification(
      id: 'notif-008',
      userId: 'usr-002',
      type: NotificationType.assignment,
      title: 'New Assignment',
      body: 'You have been assigned ticket "Database access for analytics team".',
      isRead: true,
      createdAt: DateTime(2026, 6, 10, 9, 0),
    ),
    AppNotification(
      id: 'notif-009',
      userId: 'usr-003',
      type: NotificationType.announcement,
      title: 'Policy Update',
      body: 'Updated SLA guidelines are now effective.',
      isRead: true,
      createdAt: DateTime(2026, 6, 7, 8, 0),
    ),
    AppNotification(
      id: 'notif-010',
      userId: 'usr-001',
      type: NotificationType.ticketUpdate,
      title: 'Ticket Closed',
      body: 'Your ticket "Guest WiFi password reset" has been closed.',
      isRead: true,
      createdAt: DateTime(2026, 6, 2, 15, 0),
    ),
  ];

  @override
  Future<PaginatedResponse<AppNotification>> getNotifications({
    int page = 1,
    int pageSize = 10,
    bool? isRead,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    var filtered = List<AppNotification>.from(_notifications);

    if (isRead != null) {
      filtered = filtered.where((n) => n.isRead == isRead).toList();
    }

    filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final total = filtered.length;
    final start = (page - 1) * pageSize;
    final end = start + pageSize > total ? total : start + pageSize;
    final paged =
        start < total ? filtered.sublist(start, end) : <AppNotification>[];

    return PaginatedResponse(
      data: paged,
      meta: PaginationMeta(total: total, page: page, pageSize: pageSize),
    );
  }

  @override
  Future<void> markAsRead(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));

    final index = _notifications.indexWhere((n) => n.id == id);
    if (index == -1) throw Exception('Notification not found');

    _notifications[index] = AppNotification(
      id: _notifications[index].id,
      userId: _notifications[index].userId,
      type: _notifications[index].type,
      title: _notifications[index].title,
      body: _notifications[index].body,
      isRead: true,
      createdAt: _notifications[index].createdAt,
    );
  }

  @override
  Future<void> markAllAsRead() async {
    await Future.delayed(const Duration(milliseconds: 500));

    for (var i = 0; i < _notifications.length; i++) {
      if (!_notifications[i].isRead) {
        _notifications[i] = AppNotification(
          id: _notifications[i].id,
          userId: _notifications[i].userId,
          type: _notifications[i].type,
          title: _notifications[i].title,
          body: _notifications[i].body,
          isRead: true,
          createdAt: _notifications[i].createdAt,
        );
      }
    }
  }

  @override
  Future<int> getUnreadCount() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return _notifications.where((n) => !n.isRead).length;
  }
}
