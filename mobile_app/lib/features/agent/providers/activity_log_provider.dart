import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/activity_log.dart';

final activityLogsProvider = StateProvider<List<ActivityLog>>((ref) => []);

final activityLoggerProvider = Provider<ActivityLogger>((ref) {
  return ActivityLogger(ref);
});

class ActivityLogger {
  final Ref ref;
  ActivityLogger(this.ref);

  void log(String action, String ticketId) {
    final current = ref.read(activityLogsProvider);
    ref.read(activityLogsProvider.notifier).state = [
      ActivityLog(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: 'agent',
        action: action,
        entityType: 'ticket',
        entityId: ticketId,
        createdAt: DateTime.now(),
      ),
      ...current,
    ];
  }
}
