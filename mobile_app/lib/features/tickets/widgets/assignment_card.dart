import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';

/// AssignmentCard shows agent details for a ticket.
/// Theme-aware — adapts colors for dark mode.
class AssignmentCard extends StatelessWidget {
  final String agentName;
  final String department;
  final VoidCallback? onReassign;

  const AssignmentCard({
    super.key,
    required this.agentName,
    required this.department,
    this.onReassign,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: colors.isDark ? AppColorsDark.surface : AppColors.navy,
              borderRadius: BorderRadius.zero,
            ),
            child: const Icon(
              Icons.person,
              color: AppColors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  agentName.toUpperCase(),
                  style: AppTypography.sectionLabel.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  department.toUpperCase(),
                  style: AppTypography.badge.copyWith(
                    color: colors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          if (onReassign != null)
            TextButton(
              onPressed: onReassign,
              style: TextButton.styleFrom(
                foregroundColor: colors.textPrimary,
              ),
              child: Text(
                'REASSIGN',
                style: AppTypography.sectionLabel,
              ),
            ),
        ],
      ),
    );
  }
}
