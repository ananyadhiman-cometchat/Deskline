import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/notifications/providers/notification_provider.dart';
import '../../features/tickets/providers/ticket_provider.dart';

/// Service for triggering data refreshes across the app.
class RefreshService {
  const RefreshService._();

  /// Invalidate ticket and notification providers to re-fetch from API.
  static Future<void> refreshAll(WidgetRef ref) async {
    ref.invalidate(defaultTicketsProvider);
    ref.invalidate(notificationsProvider);
  }

  /// Invalidate only ticket data.
  static Future<void> refreshTickets(WidgetRef ref) async {
    ref.invalidate(defaultTicketsProvider);
  }

  /// Invalidate only notification data.
  static Future<void> refreshNotifications(WidgetRef ref) async {
    ref.invalidate(notificationsProvider);
  }
}
