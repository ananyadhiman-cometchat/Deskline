/// API endpoint URL constants for the DeskLine backend.
/// These will be used in Phase 2 when connecting to the real API.
class ApiEndpoints {
  const ApiEndpoints._();

  static const String baseUrl = 'http://localhost:3000/api';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String currentUser = '/auth/me';

  // Tickets
  static const String tickets = '/tickets';
  static String ticketById(String id) => '/tickets/$id';
  static String ticketStatus(String id) => '/tickets/$id/status';
  static String ticketEscalate(String id) => '/tickets/$id/escalate';
  static String ticketReassign(String id) => '/tickets/$id/reassign';

  // Users
  static const String users = '/users';
  static String userById(String id) => '/users/$id';
  static String deactivateUser(String id) => '/users/$id/deactivate';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationMarkRead(String id) => '/notifications/$id/read';
  static const String notificationsMarkAllRead = '/notifications/read-all';
  static const String notificationsUnreadCount = '/notifications/unread-count';

  // Admin
  static const String adminCreateUser = '/admin/users';
  static const String activityLogs = '/admin/activity-logs';
  static const String notificationLogs = '/admin/notification-logs';
  static const String ticketAnalytics = '/admin/analytics/tickets';
  static const String agentWorkload = '/admin/analytics/agent-workload';
}
