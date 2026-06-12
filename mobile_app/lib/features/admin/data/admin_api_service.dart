import 'package:dio/dio.dart';

import '../../../core/networking/api_endpoints.dart';
import '../../../core/networking/dio_client.dart';

class AdminApiService {
  final Dio _dio;

  AdminApiService(DioClient client) : _dio = client.dio;

  // ── Admin Dashboard ─────────────────────────────────────────────

  Future<Response> getDashboard() {
    return _dio.get(ApiEndpoints.adminDashboard);
  }

  Future<Response> getAgentLoad() {
    return _dio.get(ApiEndpoints.adminAgentLoad);
  }

  // ── Activity & Notification Logs ────────────────────────────────

  Future<Response> getActivityLogs({
    int page = 1,
    int pageSize = 20,
    String? userId,
    String? action,
  }) {
    final params = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (userId != null) params['userId'] = userId;
    if (action != null) params['action'] = action;

    return _dio.get(ApiEndpoints.activityLogs, queryParameters: params);
  }

  Future<Response> getNotificationLogs({
    int page = 1,
    int pageSize = 20,
  }) {
    return _dio.get(
      ApiEndpoints.notificationLogs,
      queryParameters: {'page': page, 'pageSize': pageSize},
    );
  }

  // ── User Management ─────────────────────────────────────────────

  Future<Response> getUsers({
    int page = 1,
    int pageSize = 20,
    String? role,
    String? department,
    String? isActive,
    String? search,
  }) {
    final params = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (role != null) params['role'] = role;
    if (department != null) params['department'] = department;
    if (isActive != null) params['isActive'] = isActive;
    if (search != null) params['search'] = search;

    return _dio.get(ApiEndpoints.adminUsers, queryParameters: params);
  }

  Future<Response> createUser(Map<String, dynamic> data) {
    return _dio.post(ApiEndpoints.adminUsers, data: data);
  }

  Future<Response> updateUser(String id, Map<String, dynamic> data) {
    return _dio.patch(ApiEndpoints.adminUserById(id), data: data);
  }

  Future<Response> deactivateUser(String id) {
    return _dio.patch(ApiEndpoints.adminDeactivateUser(id));
  }

  // ── Announcements ───────────────────────────────────────────────

  Future<Response> sendAnnouncement(Map<String, dynamic> data) {
    return _dio.post(ApiEndpoints.adminAnnouncements, data: data);
  }

  // ── Supervisor ──────────────────────────────────────────────────

  Future<Response> getEscalationQueue() {
    return _dio.get(ApiEndpoints.supervisorEscalations);
  }

  Future<Response> getSupervisorDashboard() {
    return _dio.get(ApiEndpoints.supervisorDashboard);
  }

  Future<Response> getAgentMetrics() {
    return _dio.get(ApiEndpoints.agentMetrics);
  }
}
