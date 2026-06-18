import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';

abstract class AdminRepository {
  Future<User> createUser({
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  });

  Future<PaginatedResponse<ActivityLog>> getActivityLogs({
    int page = 1,
    int pageSize = 10,
    String? userId,
    String? action,
  });

  Future<PaginatedResponse<AppNotification>> getNotificationLogs({
    int page = 1,
    int pageSize = 10,
  });

  Future<TicketAnalytics> getTicketAnalytics();

  Future<List<AgentWorkload>> getAgentWorkload();

  Future<int> sendAnnouncement({
    required String title,
    required String body,
    String? targetRole,
  });
}
