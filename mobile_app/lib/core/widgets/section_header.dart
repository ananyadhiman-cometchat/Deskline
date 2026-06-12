import 'package:flutter/material.dart';

import '../theme/color_scheme.dart';
import '../theme/typography.dart';

/// Section label matching the web's `.section-label` class.
/// Uses Bebas Neue 14px, red color, wide tracking, uppercase.
/// Includes bottom red border accent.
class SectionHeader extends StatelessWidget {
  final String title;

  const SectionHeader({
    super.key,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    // Red color is brand-invariant (same in both themes)
    return Semantics(
      header: true,
      label: title,
      child: Container(
        padding: const EdgeInsets.only(bottom: 8),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: AppColors.primaryRed, width: 2),
          ),
        ),
        child: Text(
          title.toUpperCase(),
          style: AppTypography.sectionLabelDisplay.copyWith(
            color: AppColors.primaryRed,
          ),
        ),
      ),
    );
  }
}
