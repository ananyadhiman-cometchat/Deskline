import 'package:flutter/material.dart';

import '../theme/color_scheme.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// Alert banner matching the web's `.alert` component.
///
/// Left accent border (4px) with subtle tinted background.
/// Variants: error (red), success (green), warning (amber), info (blue).
class AppAlert extends StatelessWidget {
  final String message;
  final AppAlertVariant variant;
  final IconData? icon;

  const AppAlert({
    super.key,
    required this.message,
    this.variant = AppAlertVariant.error,
    this.icon,
  });

  const AppAlert.error({super.key, required this.message, this.icon})
      : variant = AppAlertVariant.error;

  const AppAlert.success({super.key, required this.message, this.icon})
      : variant = AppAlertVariant.success;

  const AppAlert.warning({super.key, required this.message, this.icon})
      : variant = AppAlertVariant.warning;

  const AppAlert.info({super.key, required this.message, this.icon})
      : variant = AppAlertVariant.info;

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    final accentColor = _accentColor;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 14,
      ),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.05),
        border: Border(
          left: BorderSide(color: accentColor, width: 4),
        ),
      ),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: accentColor),
            const SizedBox(width: AppSpacing.sm),
          ],
          Expanded(
            child: Text(
              message,
              style: AppTypography.bodySmall.copyWith(
                color: colors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color get _accentColor {
    switch (variant) {
      case AppAlertVariant.error:
        return AppColors.primaryRed;
      case AppAlertVariant.success:
        return AppColors.successGreen;
      case AppAlertVariant.warning:
        return AppColors.warningYellow;
      case AppAlertVariant.info:
        return const Color(0xFF3B82F6);
    }
  }
}

enum AppAlertVariant { error, success, warning, info }
