import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/layout/app_shell.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../providers/notification_provider.dart';
import '../../../shared/services/refresh_service.dart';

class NotificationCenterScreen extends ConsumerStatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  ConsumerState<NotificationCenterScreen> createState() =>
      _NotificationCenterScreenState();
}

class _NotificationCenterScreenState
    extends ConsumerState<NotificationCenterScreen> {
  bool _unreadOnly = false;

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    var items = ref.watch(notificationListProvider);
    if (_unreadOnly) {
      items = items.where((e) => !e.isRead).toList();
    }
    final today = items
        .where((e) => DateTime.now().difference(e.createdAt).inDays < 1)
        .toList();
    final older = items
        .where((e) => DateTime.now().difference(e.createdAt).inDays >= 1)
        .toList();

    return AppShell(
      child: RefreshIndicator(
        onRefresh: () => RefreshService.refreshNotifications(ref),
        child: Column(
          children: [
            SwitchListTile(
              value: _unreadOnly,
              onChanged: (v) => setState(() => _unreadOnly = v),
              title: Text(
                'Unread only',
                style: AppTypography.bodySmall.copyWith(
                  color: colors.textPrimary,
                ),
              ),
            ),
            Expanded(
              child: ListView(
                children: [
                  if (today.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      child: Text(
                        'TODAY',
                        style: AppTypography.sectionLabel.copyWith(
                          color: colors.textMuted,
                        ),
                      ),
                    ),
                    ...today.map((n) => _buildNotificationTile(n, colors)),
                  ],
                  if (older.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      child: Text(
                        'OLDER',
                        style: AppTypography.sectionLabel.copyWith(
                          color: colors.textMuted,
                        ),
                      ),
                    ),
                    ...older.map((n) => _buildNotificationTile(n, colors)),
                  ],
                  if (items.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.xl),
                      child: Center(
                        child: Text(
                          'No notifications',
                          style: AppTypography.bodySmall.copyWith(
                            color: colors.textMuted,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationTile(dynamic n, DesklineColors colors) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(
          color: n.isRead ? colors.borderColor : AppColors.primaryRed,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            n.title,
            style: AppTypography.cardTitle.copyWith(
              color: colors.textPrimary,
              fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            n.body,
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
        ],
      ),
    );
  }
}
