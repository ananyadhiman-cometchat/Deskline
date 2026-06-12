import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/admin_repository.dart';
import '../data/mock_admin_repository.dart';
import '../data/mock_user_repository.dart';
import '../../../shared/models/models.dart';

// Repository provider
final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return MockAdminRepository();
});

// User list provider
final usersProvider = FutureProvider<List<User>>((ref) async => []);

// Simplified synchronous provider for widget consumption
final userListProvider = Provider<List<User>>((ref) {
  final users = ref.watch(usersProvider);
  return users.valueOrNull ?? [];
});

final mockUsersProvider = FutureProvider<List<User>>((ref) async {
  return (await MockUserRepository().getUsers()).data;
});

// Ticket analytics provider
final ticketAnalyticsProvider = FutureProvider<TicketAnalytics>((ref) async {
  final repository = ref.watch(adminRepositoryProvider);
  return await repository.getTicketAnalytics();
});

// Agent workload provider
final agentWorkloadProvider = FutureProvider<List<AgentWorkload>>((ref) async {
  final repository = ref.watch(adminRepositoryProvider);
  return await repository.getAgentWorkload();
});

final activityLogsProvider = FutureProvider((ref) async {
  return (await ref.watch(adminRepositoryProvider).getActivityLogs()).data;
});

final notificationLogsProvider = FutureProvider((ref) async {
  return (await ref.watch(adminRepositoryProvider).getNotificationLogs()).data;
});