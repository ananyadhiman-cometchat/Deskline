/// API endpoint URL constants for the DeskLine backend.
/// Single source of truth for all endpoint paths.
class ApiEndpoints {
  const ApiEndpoints._();

  /// Base URL for the DeskLine backend.
  ///
  /// Android emulator: use 10.0.2.2 to reach the host machine's localhost
  /// (the Docker backend exposed on port 4000).
  /// iOS simulator: use localhost / 127.0.0.1.
  /// Physical device (same WiFi): use the host Mac's LAN IP, e.g. 192.168.1.62.
  /// Staging: https://deskline.cometchat-staging.com/api
  static const String baseUrl = 'http://10.0.2.2:4000/api';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String currentUser = '/auth/me';

  // Tickets
  static const String tickets = '/tickets';
  static String ticketById(String id) => '/tickets/$id';
  static String ticketStatus(String id) => '/tickets/$id';
  static String ticketEscalate(String id) => '/tickets/$id/escalate';
  static String ticketReassign(String id) => '/tickets/$id';
  static String ticketConfirmResolution(String id) =>
      '/tickets/$id/confirm-resolution';
  static String ticketRejectResolution(String id) =>
      '/tickets/$id/reject-resolution';
  static String ticketRequestHumanHelp(String id) =>
      '/tickets/$id/request-human-help';

  // Ticket Comments
  static String ticketComments(String id) => '/tickets/$id/comments';

  // Users / Profile
  static const String userProfile = '/users/profile';
  static const String userFcmToken = '/users/me/fcm-token';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationMarkRead(String id) => '/notifications/$id/read';
  static const String notificationsMarkAllRead = '/notifications/read-all';
  static const String notificationsUnreadCount = '/notifications/unread-count';

  // Admin - Users
  static const String adminUsers = '/admin/users';
  static String adminUserById(String id) => '/admin/users/$id';
  static String adminDeactivateUser(String id) => '/admin/users/$id/deactivate';

  // Admin - Logs & Dashboard
  static const String activityLogs = '/admin/activity-logs';
  static const String notificationLogs = '/admin/notification-logs';
  static const String adminDashboard = '/admin/dashboard';
  static const String adminAgentLoad = '/admin/agent-load';
  static const String adminAnnouncements = '/admin/announcements';

  // Supervisor
  static const String supervisorEscalations = '/admin/supervisor/escalations';
  static const String supervisorDashboard = '/admin/supervisor/dashboard';
  static const String agentMetrics = '/admin/agent/metrics';

  // CometChat
  static const String cometchatAuthToken = '/cometchat/auth-token';
}
