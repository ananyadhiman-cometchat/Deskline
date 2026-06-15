import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/dio_provider.dart';
import '../../../shared/models/models.dart';
import '../../../shared/services/environment_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/api_notification_repository.dart';
import '../data/mock_notification_repository.dart';
import '../data/notification_repository.dart';

// Repository provider
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  if (ref.watch(dataSourceProvider) == DataSource.api) {
    final dioClient = ref.watch(dioClientProvider);
    return ApiNotificationRepository(dioClient: dioClient);
  }
  return MockNotificationRepository();
});

// Notification list provider — watches auth to re-fetch on login/logout
final notificationsProvider =
    FutureProvider<List<AppNotification>>((ref) async {
  final auth = ref.watch(authStateProvider);
  if (!auth.isAuthenticated) return [];

  final repository = ref.watch(notificationRepositoryProvider);
  final response = await repository.getNotifications();
  return response.data;
});

// Simplified synchronous provider for widget consumption
final notificationListProvider = Provider<List<AppNotification>>((ref) {
  final notifications = ref.watch(notificationsProvider);
  return notifications.valueOrNull ?? [];
});

// Unread count provider for notification bell badge
final unreadCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationListProvider);
  return notifications.where((n) => !n.isRead).length;
});
