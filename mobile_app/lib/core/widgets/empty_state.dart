import 'package:flutter/material.dart';

import '../theme/color_scheme.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// Centered message with optional icon for no-data screens.
/// Theme-aware — adapts text and icon colors.
class EmptyState extends StatelessWidget {
  final String message;
  final IconData? icon;

  const EmptyState({
    super.key,
    required this.message,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 48,
                color: colors.textMuted.withValues(alpha: 0.5),
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            Text(
              message,
              style: AppTypography.body.copyWith(color: colors.textMuted),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
