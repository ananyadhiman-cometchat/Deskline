import 'package:dio/dio.dart';

import '../../../core/networking/api_endpoints.dart';
import '../../../core/networking/dio_client.dart';

class NotificationApiService {
  final Dio _dio;

  NotificationApiService(DioClient client) : _dio = client.dio;

  Future<Response> getNotifications({int page = 1, int pageSize = 20}) {
    return _dio.get(
      ApiEndpoints.notifications,
      queryParameters: {'page': page, 'pageSize': pageSize},
    );
  }

  Future<Response> markAsRead(String id) {
    return _dio.patch(ApiEndpoints.notificationMarkRead(id));
  }

  Future<Response> markAllAsRead() {
    return _dio.patch(ApiEndpoints.notificationsMarkAllRead);
  }

  Future<Response> getUnreadCount() {
    return _dio.get(ApiEndpoints.notificationsUnreadCount);
  }

  Future<Response> registerFcmToken(String token) {
    return _dio.patch(
      ApiEndpoints.userFcmToken,
      data: {'fcmToken': token},
    );
  }
}
