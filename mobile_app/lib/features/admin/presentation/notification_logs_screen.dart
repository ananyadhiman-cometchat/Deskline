import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';

/// Notification Logs screen with styled entries.
class NotificationLogsScreen extends ConsumerWidget {
  const NotificationLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final notifications = ref.watch(notificationLogsProvider);

    return notifications.when(
      data: (items) => ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'NOTIFICATION LOGS',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${items.length} notifications sent.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),

          const SectionHeader(title: 'ALL NOTIFICATIONS'),
          const SizedBox(height: AppSpacing.sm),

          ...items.map((n) => Container(
            margin: const EdgeInsets.only(bottom: 1),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.cardBackground,
              border: Border(
                bottom: BorderSide(color: colors.borderColor, width: 1),
                left: BorderSide(
                  color: n.isRead ? Colors.transparent : AppColors.primaryRed,
                  width: 3,
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        n.title,
                        style: AppTypography.notificationTitle.copyWith(
                          color: colors.textPrimary,
                        ),
                      ),
                    ),
                    if (!n.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.primaryRed,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  n.body,
                  style: AppTypography.notificationBody.copyWith(
                    color: colors.textMuted,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Text(
                  _formatDate(n.createdAt),
                  style: AppTypography.caption.copyWith(color: colors.textMuted),
                ),
              ],
            ),
          )),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, s) => Center(
        child: Text('Error', style: AppTypography.body.copyWith(color: AppColors.errorRed)),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
