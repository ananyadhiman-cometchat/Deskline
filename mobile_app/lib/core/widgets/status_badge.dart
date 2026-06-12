import 'package:flutter/material.dart';

import '../theme/typography.dart';

/// Compact badge with 0px border radius, configurable background/text color,
/// and uppercase text.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.zero,
      ),
      child: Text(
        label.toUpperCase(),
        style: AppTypography.badge.copyWith(color: textColor),
      ),
    );
  }
}
