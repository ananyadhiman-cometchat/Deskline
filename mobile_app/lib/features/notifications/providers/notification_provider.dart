import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_notification_repository.dart';
import '../data/notification_repository.dart';
import '../../../shared/models/models.dart';

// Repository provider
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return MockNotificationRepository();
});

// Notification list provider
final notificationsProvider = FutureProvider<List<AppNotification>>((ref) async {
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