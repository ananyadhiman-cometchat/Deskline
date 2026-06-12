import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../../auth/providers/auth_provider.dart';

/// ProfileScreen — displays user information matching the design system.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final user = ref.watch(authStateProvider).user;

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      children: [
        const SizedBox(height: AppSpacing.lg),
        Text(
          'PROFILE',
          style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Your account information.',
          style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── Avatar + Name ────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: colors.cardBackground,
            border: Border.all(color: colors.borderColor, width: 1),
          ),
          child: Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primaryRed.withValues(alpha: 0.1),
                  border: Border.all(
                    color: AppColors.primaryRed.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    user.name.isNotEmpty
                        ? user.name[0].toUpperCase()
                        : 'U',
                    style: AppTypography.sectionHeadline.copyWith(
                      color: AppColors.primaryRed,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name.toUpperCase(),
                      style: AppTypography.cardTitle.copyWith(
                        color: colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email,
                      style: AppTypography.bodySmall.copyWith(
                        color: colors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // ─── Details ──────────────────────────────────────────
        const SectionHeader(title: 'ACCOUNT DETAILS'),
        const SizedBox(height: AppSpacing.sm),
        _InfoRow(label: 'ROLE', value: user.role.name.toUpperCase(), colors: colors),
        _InfoRow(label: 'DEPARTMENT', value: user.department.name.toUpperCase(), colors: colors),
        _InfoRow(label: 'STATUS', value: user.isActive ? 'ACTIVE' : 'INACTIVE', colors: colors),
        _InfoRow(label: 'USER ID', value: user.id.substring(0, 8).toUpperCase(), colors: colors),
        _InfoRow(label: 'JOINED', value: _formatDate(user.createdAt), colors: colors),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final DesklineColors colors;

  const _InfoRow({required this.label, required this.value, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: colors.borderColor, width: 1),
        ),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: AppTypography.formLabel.copyWith(color: colors.textMuted),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTypography.bodySmall.copyWith(
                color: colors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
