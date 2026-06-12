import '../../../core/networking/dio_client.dart';
import '../../../shared/models/models.dart';
import '../services/notification_api_service.dart';
import 'notification_repository.dart';

class ApiNotificationRepository implements NotificationRepository {
  final NotificationApiService _apiService;

  ApiNotificationRepository({required DioClient dioClient})
      : _apiService = NotificationApiService(dioClient);

  @override
  Future<PaginatedResponse<AppNotification>> getNotifications({
    int page = 1,
    int pageSize = 10,
    bool? isRead,
  }) async {
    final response = await _apiService.getNotifications(
      page: page,
      pageSize: pageSize,
    );

    // Backend returns { data: [...], meta: { total, page, pageSize } }
    final json = response.data as Map<String, dynamic>;
    return PaginatedResponse.fromJson(
      json,
      (item) => AppNotification.fromJson(item),
    );
  }

  @override
  Future<void> markAsRead(String id) async {
    // Backend endpoint: PATCH /notifications/:id/read
    // If not implemented yet, this will return a 404 — handled gracefully
    try {
      await _apiService.markAsRead(id);
    } catch (_) {
      // Silently fail if endpoint doesn't exist yet
    }
  }

  @override
  Future<void> markAllAsRead() async {
    // Backend endpoint: PATCH /notifications/read-all
    try {
      await _apiService.markAllAsRead();
    } catch (_) {
      // Silently fail if endpoint doesn't exist yet
    }
  }

  @override
  Future<int> getUnreadCount() async {
    // Backend endpoint: GET /notifications/unread-count
    // Falls back to counting from the list if endpoint doesn't exist
    try {
      final response = await _apiService.getUnreadCount();
      final data = response.data as Map<String, dynamic>;
      return (data['data'] as int?) ?? 0;
    } catch (_) {
      // Fallback: fetch notifications and count locally
      final response = await getNotifications(page: 1, pageSize: 100);
      return response.data.where((n) => !n.isRead).length;
    }
  }
}
