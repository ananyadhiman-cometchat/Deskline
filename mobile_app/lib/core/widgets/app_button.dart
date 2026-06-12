import 'package:flutter/material.dart';

import '../animations/pressable.dart';
import '../theme/color_scheme.dart';
import '../theme/typography.dart';

/// Primary and secondary button components with 0px border radius,
/// 48px height, uppercase labels, and loading state support.
/// Theme-aware: secondary button adapts border/text color in dark mode.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isSecondary;
  final double? width;
  final IconData? icon;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isSecondary = false,
    this.width,
    this.icon,
  });

  /// Primary button factory — red background, white text.
  const AppButton.primary({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.width,
    this.icon,
  }) : isSecondary = false;

  /// Secondary button factory — white/dark background, navy/white border.
  const AppButton.secondary({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.width,
    this.icon,
  }) : isSecondary = true;

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    final child = isLoading
        ? SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                isSecondary ? colors.secondaryButtonColor : AppColors.white,
              ),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
                const SizedBox(width: 8),
              ],
              Text(label.toUpperCase()),
            ],
          );

    if (isSecondary) {
      return SizedBox(
        width: width,
        height: 48,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: colors.secondaryButtonColor,
            side: BorderSide(color: colors.secondaryButtonColor, width: 1),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.zero,
            ),
            textStyle: AppTypography.navigationLabel,
          ),
          child: child,
        ),
      );
    }

    return Pressable(
      onTap: isLoading ? null : onPressed,
      scaleFactor: 0.97,
      child: Semantics(
        button: true,
        label: label,
        child: SizedBox(
          width: width,
          height: 48,
          child: ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryRed,
              foregroundColor: AppColors.white,
              elevation: 0,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.zero,
              ),
              textStyle: AppTypography.navigationLabel,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
