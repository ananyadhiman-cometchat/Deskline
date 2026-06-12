import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/dio_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/services/environment_provider.dart';
import '../data/admin_repository.dart';
import '../data/api_admin_repository.dart';
import '../data/api_user_repository.dart';
import '../data/mock_admin_repository.dart';
import '../data/mock_user_repository.dart';
import '../data/user_repository.dart';

// Admin repository provider
final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  if (ref.watch(dataSourceProvider) == DataSource.api) {
    final dioClient = ref.watch(dioClientProvider);
    return ApiAdminRepository(dioClient: dioClient);
  }
  return MockAdminRepository();
});

// User repository provider
final userRepositoryProvider = Provider<UserRepository>((ref) {
  if (ref.watch(dataSourceProvider) == DataSource.api) {
    final dioClient = ref.watch(dioClientProvider);
    return ApiUserRepository(dioClient: dioClient);
  }
  return MockUserRepository();
});

// User list provider
final usersProvider = FutureProvider<List<User>>((ref) async {
  final repository = ref.watch(userRepositoryProvider);
  final response = await repository.getUsers(pageSize: 100);
  return response.data;
});

// Simplified synchronous provider for widget consumption
final userListProvider = Provider<List<User>>((ref) {
  final users = ref.watch(usersProvider);
  return users.valueOrNull ?? [];
});

// Ticket analytics provider
final ticketAnalyticsProvider = FutureProvider<TicketAnalytics>((ref) async {
  final repository = ref.watch(adminRepositoryProvider);
  return repository.getTicketAnalytics();
});

// Agent workload provider
final agentWorkloadProvider = FutureProvider<List<AgentWorkload>>((ref) async {
  final repository = ref.watch(adminRepositoryProvider);
  return repository.getAgentWorkload();
});

// Activity logs provider
final activityLogsProvider = FutureProvider<List<ActivityLog>>((ref) async {
  final repository = ref.watch(adminRepositoryProvider);
  final response = await repository.getActivityLogs(pageSize: 50);
  return response.data;
});

// Notification logs provider
final notificationLogsProvider =
    FutureProvider<List<AppNotification>>((ref) async {
  final repository = ref.watch(adminRepositoryProvider);
  final response = await repository.getNotificationLogs(pageSize: 50);
  return response.data;
});
