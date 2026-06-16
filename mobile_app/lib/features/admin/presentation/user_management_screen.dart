import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';

class UserManagementScreen extends ConsumerWidget {
  const UserManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final users = ref.watch(usersProvider);

    return users.when(
      data: (data) => ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'USER MANAGEMENT',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${data.length} users registered.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.lg),

          // Action buttons — wrapped to avoid overflow
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              SizedBox(
                height: 36,
                child: ElevatedButton.icon(
                  onPressed: () => _showDialog(context, 'Create User', 'Create user form ready for repository wiring.'),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('CREATE'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryRed,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                    textStyle: AppTypography.badge,
                  ),
                ),
              ),
              SizedBox(
                height: 36,
                child: OutlinedButton.icon(
                  onPressed: () => _showDialog(context, 'Edit User', 'Select a user to edit.'),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('EDIT'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: colors.textPrimary,
                    side: BorderSide(color: colors.borderColor, width: 1),
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                    textStyle: AppTypography.badge,
                  ),
                ),
              ),
              SizedBox(
                height: 36,
                child: OutlinedButton.icon(
                  onPressed: () => _showDialog(context, 'Deactivate', 'Are you sure?'),
                  icon: const Icon(Icons.block, size: 16),
                  label: const Text('DEACTIVATE'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.errorRed,
                    side: const BorderSide(color: AppColors.errorRed, width: 1),
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                    textStyle: AppTypography.badge,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          const SectionHeader(title: 'ALL USERS'),
          const SizedBox(height: AppSpacing.sm),

          // User list as styled cards — tap to manage
          ...data.map((user) => GestureDetector(
            onTap: () => _showUserActions(context, user, colors),
            child: Container(
              margin: const EdgeInsets.only(bottom: AppSpacing.xs),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: colors.cardBackground,
                border: Border.all(color: colors.borderColor, width: 1),
              ),
              child: Row(
                children: [
                  // Avatar
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.primaryRed.withValues(alpha: 0.08),
                      border: Border.all(color: AppColors.primaryRed.withValues(alpha: 0.2)),
                    ),
                    child: Center(
                      child: Text(
                        user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                        style: AppTypography.badge.copyWith(color: AppColors.primaryRed),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: AppTypography.bodySmall.copyWith(
                            color: colors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          user.email,
                          style: AppTypography.caption.copyWith(color: colors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  // Role badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _roleColor(user.role.name).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Text(
                      user.role.name.toUpperCase(),
                      style: AppTypography.badge.copyWith(color: _roleColor(user.role.name)),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  // Active indicator
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: user.isActive ? AppColors.successGreen : AppColors.errorRed,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ),
          )),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (error, stack) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Error loading users', style: AppTypography.body.copyWith(color: AppColors.errorRed)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.invalidate(usersProvider),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryRed,
                foregroundColor: Colors.white,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: const Text('RETRY'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDialog(BuildContext context, String title, String content) {
    final colors = DesklineColors.of(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.cardBackground,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        title: Text(title, style: AppTypography.cardTitle.copyWith(color: colors.textPrimary)),
        content: Text(content, style: AppTypography.bodySmall.copyWith(color: colors.textMuted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('CLOSE', style: AppTypography.badge.copyWith(color: AppColors.primaryRed)),
          ),
        ],
      ),
    );
  }

  void _showUserActions(BuildContext context, dynamic user, DesklineColors colors) {
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.cardBackground,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name.toString().toUpperCase(),
                      style: AppTypography.cardTitle.copyWith(color: colors.textPrimary),
                    ),
                    Text(
                      user.email.toString(),
                      style: AppTypography.caption.copyWith(color: colors.textMuted),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: colors.borderColor),
              _actionTile(ctx, Icons.edit_outlined, 'EDIT USER', colors, () {
                Navigator.pop(ctx);
                _showDialog(context, 'Edit ${user.name}', 'Edit form ready for repository wiring.');
              }),
              _actionTile(ctx, Icons.swap_horiz, 'CHANGE ROLE', colors, () {
                Navigator.pop(ctx);
                _showDialog(context, 'Change Role', 'Role change for ${user.name} ready for repository wiring.');
              }),
              _actionTile(
                ctx,
                user.isActive ? Icons.block : Icons.check_circle_outline,
                user.isActive ? 'DEACTIVATE' : 'REACTIVATE',
                colors,
                () {
                  Navigator.pop(ctx);
                  _showDialog(
                    context,
                    user.isActive ? 'Deactivate ${user.name}?' : 'Reactivate ${user.name}?',
                    'This action will be connected to the repository.',
                  );
                },
                isDestructive: user.isActive,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _actionTile(BuildContext ctx, IconData icon, String label, DesklineColors colors, VoidCallback onTap, {bool isDestructive = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: colors.borderColor, width: 1)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: isDestructive ? AppColors.errorRed : colors.textPrimary),
            const SizedBox(width: AppSpacing.md),
            Text(
              label,
              style: AppTypography.navigationLabel.copyWith(
                color: isDestructive ? AppColors.errorRed : colors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'admin': return AppColors.roleAdmin;
      case 'supervisor': return AppColors.roleSupervisor;
      case 'agent': return AppColors.roleAgent;
      default: return AppColors.roleEmployee;
    }
  }
}
