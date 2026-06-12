import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';

/// Activity Logs screen with styled log entries and search.
class ActivityLogsScreen extends ConsumerWidget {
  const ActivityLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final logs = ref.watch(activityLogsProvider);

    return logs.when(
      data: (items) => ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'ACTIVITY LOGS',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${items.length} log entries.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),

          const SectionHeader(title: 'RECENT ACTIVITY'),
          const SizedBox(height: AppSpacing.sm),

          ...items.map((log) => Container(
            margin: const EdgeInsets.only(bottom: 1),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            decoration: BoxDecoration(
              color: colors.cardBackground,
              border: Border(
                bottom: BorderSide(color: colors.borderColor, width: 1),
                left: BorderSide(
                  color: _actionColor(log.action),
                  width: 3,
                ),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Action icon
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: _actionColor(log.action).withValues(alpha: 0.1),
                  ),
                  child: Icon(
                    _actionIcon(log.action),
                    size: 16,
                    color: _actionColor(log.action),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        log.action.toUpperCase(),
                        style: AppTypography.badge.copyWith(
                          color: colors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${log.entityType} · ${log.entityId.length > 8 ? log.entityId.substring(0, 8) : log.entityId}',
                        style: AppTypography.caption.copyWith(
                          color: colors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                // Timestamp
                Text(
                  _formatDate(log.createdAt),
                  style: AppTypography.caption.copyWith(color: colors.textMuted),
                ),
              ],
            ),
          )),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, s) => Center(
        child: Text('Error loading logs', style: AppTypography.body.copyWith(color: AppColors.errorRed)),
      ),
    );
  }

  Color _actionColor(String action) {
    if (action.contains('create')) return AppColors.successGreen;
    if (action.contains('update')) return const Color(0xFF3B82F6);
    if (action.contains('delete') || action.contains('deactivate')) return AppColors.errorRed;
    if (action.contains('escalat')) return AppColors.warningYellow;
    return AppColors.mutedText;
  }

  IconData _actionIcon(String action) {
    if (action.contains('create')) return Icons.add_circle_outline;
    if (action.contains('update')) return Icons.edit_outlined;
    if (action.contains('delete') || action.contains('deactivate')) return Icons.remove_circle_outline;
    if (action.contains('escalat')) return Icons.warning_amber_outlined;
    if (action.contains('login')) return Icons.login;
    return Icons.history;
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
