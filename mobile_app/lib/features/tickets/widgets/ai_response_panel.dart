import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';

/// AIResponsePanel matches the web's `.ai-panel` component.
///
/// Features:
/// - Blue top border (3px, #3B82F6)
/// - Header with surface background, blue label
/// - Body with response text
/// - Theme-aware backgrounds
class AIResponsePanel extends StatelessWidget {
  final String aiResponse;

  const AIResponsePanel({
    super.key,
    required this.aiResponse,
  });

  static const _aiBlue = Color(0xFF3B82F6);

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);

    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Blue top accent
          Container(height: 3, color: _aiBlue),

          // Header
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: 14,
            ),
            decoration: BoxDecoration(
              color: colors.surface,
              border: Border(
                bottom: BorderSide(color: colors.borderColor, width: 1),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, size: 16, color: _aiBlue),
                const SizedBox(width: 10),
                Text(
                  'AI RESPONSE',
                  style: AppTypography.formLabel.copyWith(color: _aiBlue),
                ),
              ],
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Text(
              aiResponse,
              style: AppTypography.bodySmall.copyWith(
                color: colors.textPrimary,
                height: 1.7,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
