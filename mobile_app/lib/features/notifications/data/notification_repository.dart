import '../../../shared/models/models.dart';

abstract class NotificationRepository {
  Future<PaginatedResponse<AppNotification>> getNotifications({
    int page = 1,
    int pageSize = 10,
    bool? isRead,
  });

  Future<void> markAsRead(String id);

  Future<void> markAllAsRead();

  Future<int> getUnreadCount();
}
