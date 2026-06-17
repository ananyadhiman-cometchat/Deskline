import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
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

          // Action buttons
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              SizedBox(
                height: 36,
                child: ElevatedButton.icon(
                  onPressed: () => _showCreateUserDialog(context, ref),
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
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          const SectionHeader(title: 'ALL USERS'),
          const SizedBox(height: AppSpacing.sm),

          // User list
          ...data.map((user) => GestureDetector(
            onTap: () => _showUserActions(context, ref, user),
            child: Container(
              margin: const EdgeInsets.only(bottom: AppSpacing.xs),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: colors.cardBackground,
                border: Border.all(color: colors.borderColor, width: 1),
              ),
              child: Row(
                children: [
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

  // ── Create User Dialog ──────────────────────────────────────────

  void _showCreateUserDialog(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final passwordController = TextEditingController();
    UserRole selectedRole = UserRole.employee;
    Department selectedDepartment = Department.general;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          backgroundColor: colors.cardBackground,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          title: Text('CREATE USER', style: AppTypography.cardTitle.copyWith(color: colors.textPrimary)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTextField(nameController, 'Full Name', colors),
                const SizedBox(height: AppSpacing.sm),
                _buildTextField(emailController, 'Email', colors, keyboardType: TextInputType.emailAddress),
                const SizedBox(height: AppSpacing.sm),
                _buildTextField(passwordController, 'Password', colors, obscure: true),
                const SizedBox(height: AppSpacing.sm),
                _buildDropdown<UserRole>(
                  label: 'Role',
                  value: selectedRole,
                  items: UserRole.values,
                  colors: colors,
                  onChanged: (v) => setState(() => selectedRole = v!),
                ),
                const SizedBox(height: AppSpacing.sm),
                _buildDropdown<Department>(
                  label: 'Department',
                  value: selectedDepartment,
                  items: Department.values,
                  colors: colors,
                  onChanged: (v) => setState(() => selectedDepartment = v!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('CANCEL', style: AppTypography.badge.copyWith(color: colors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameController.text.isEmpty || emailController.text.isEmpty || passwordController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('All fields are required')),
                  );
                  return;
                }
                Navigator.of(ctx).pop();
                await _createUser(
                  context,
                  ref,
                  name: nameController.text.trim(),
                  email: emailController.text.trim(),
                  password: passwordController.text,
                  role: selectedRole,
                  department: selectedDepartment,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryRed,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: const Text('CREATE'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createUser(
    BuildContext context,
    WidgetRef ref, {
    required String name,
    required String email,
    required String password,
    required UserRole role,
    required Department department,
  }) async {
    try {
      final repository = ref.read(userRepositoryProvider);
      await repository.createUser(
        name: name,
        email: email,
        password: password,
        role: role,
        department: department,
      );
      ref.invalidate(usersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('User "$name" created successfully')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create user: $e')),
        );
      }
    }
  }

  // ── User Actions Bottom Sheet ───────────────────────────────────

  void _showUserActions(BuildContext context, WidgetRef ref, User user) {
    final colors = DesklineColors.of(context);
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
                      user.name.toUpperCase(),
                      style: AppTypography.cardTitle.copyWith(color: colors.textPrimary),
                    ),
                    Text(
                      user.email,
                      style: AppTypography.caption.copyWith(color: colors.textMuted),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: colors.borderColor),
              _actionTile(ctx, Icons.edit_outlined, 'EDIT USER', colors, () {
                Navigator.pop(ctx);
                _showEditUserDialog(context, ref, user);
              }),
              _actionTile(ctx, Icons.swap_horiz, 'CHANGE ROLE', colors, () {
                Navigator.pop(ctx);
                _showChangeRoleDialog(context, ref, user);
              }),
              _actionTile(
                ctx,
                user.isActive ? Icons.block : Icons.check_circle_outline,
                user.isActive ? 'DEACTIVATE' : 'REACTIVATE',
                colors,
                () {
                  Navigator.pop(ctx);
                  if (user.isActive) {
                    _showDeactivateConfirmation(context, ref, user);
                  } else {
                    _reactivateUser(context, ref, user);
                  }
                },
                isDestructive: user.isActive,
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Edit User Dialog ────────────────────────────────────────────

  void _showEditUserDialog(BuildContext context, WidgetRef ref, User user) {
    final colors = DesklineColors.of(context);
    final nameController = TextEditingController(text: user.name);
    final emailController = TextEditingController(text: user.email);
    Department selectedDepartment = user.department;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          backgroundColor: colors.cardBackground,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          title: Text('EDIT USER', style: AppTypography.cardTitle.copyWith(color: colors.textPrimary)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTextField(nameController, 'Full Name', colors),
                const SizedBox(height: AppSpacing.sm),
                _buildTextField(emailController, 'Email', colors, keyboardType: TextInputType.emailAddress),
                const SizedBox(height: AppSpacing.sm),
                _buildDropdown<Department>(
                  label: 'Department',
                  value: selectedDepartment,
                  items: Department.values,
                  colors: colors,
                  onChanged: (v) => setState(() => selectedDepartment = v!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('CANCEL', style: AppTypography.badge.copyWith(color: colors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                await _updateUser(
                  context,
                  ref,
                  user: user,
                  name: nameController.text.trim(),
                  email: emailController.text.trim(),
                  department: selectedDepartment,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryRed,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: const Text('SAVE'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateUser(
    BuildContext context,
    WidgetRef ref, {
    required User user,
    required String name,
    required String email,
    required Department department,
  }) async {
    try {
      final repository = ref.read(userRepositoryProvider);
      await repository.updateUser(
        id: user.id,
        name: name != user.name ? name : null,
        email: email != user.email ? email : null,
        department: department != user.department ? department : null,
      );
      ref.invalidate(usersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('User "${name}" updated successfully')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update user: $e')),
        );
      }
    }
  }

  // ── Change Role Dialog ──────────────────────────────────────────

  void _showChangeRoleDialog(BuildContext context, WidgetRef ref, User user) {
    final colors = DesklineColors.of(context);
    UserRole selectedRole = user.role;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          backgroundColor: colors.cardBackground,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          title: Text('CHANGE ROLE', style: AppTypography.cardTitle.copyWith(color: colors.textPrimary)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Changing role for ${user.name}',
                style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
              ),
              const SizedBox(height: AppSpacing.md),
              _buildDropdown<UserRole>(
                label: 'Role',
                value: selectedRole,
                items: UserRole.values,
                colors: colors,
                onChanged: (v) => setState(() => selectedRole = v!),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('CANCEL', style: AppTypography.badge.copyWith(color: colors.textMuted)),
            ),
            ElevatedButton(
              onPressed: selectedRole == user.role
                  ? null
                  : () async {
                      Navigator.of(ctx).pop();
                      await _changeRole(context, ref, user, selectedRole);
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryRed,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
              ),
              child: const Text('CHANGE'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _changeRole(BuildContext context, WidgetRef ref, User user, UserRole newRole) async {
    try {
      final repository = ref.read(userRepositoryProvider);
      await repository.updateUser(id: user.id, role: newRole);
      ref.invalidate(usersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${user.name} role changed to ${newRole.name}')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to change role: $e')),
        );
      }
    }
  }

  // ── Deactivate Confirmation ─────────────────────────────────────

  void _showDeactivateConfirmation(BuildContext context, WidgetRef ref, User user) {
    final colors = DesklineColors.of(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.cardBackground,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        title: Text('DEACTIVATE USER', style: AppTypography.cardTitle.copyWith(color: AppColors.errorRed)),
        content: Text(
          'Are you sure you want to deactivate ${user.name}?\n\nThis will revoke their access and log them out of all sessions.',
          style: AppTypography.bodySmall.copyWith(color: colors.textPrimary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('CANCEL', style: AppTypography.badge.copyWith(color: colors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _deactivateUser(context, ref, user);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorRed,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
            ),
            child: const Text('DEACTIVATE'),
          ),
        ],
      ),
    );
  }

  Future<void> _deactivateUser(BuildContext context, WidgetRef ref, User user) async {
    try {
      final repository = ref.read(userRepositoryProvider);
      await repository.deactivateUser(user.id);
      ref.invalidate(usersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${user.name} has been deactivated')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to deactivate user: $e')),
        );
      }
    }
  }

  // ── Reactivate User ─────────────────────────────────────────────

  Future<void> _reactivateUser(BuildContext context, WidgetRef ref, User user) async {
    try {
      final repository = ref.read(userRepositoryProvider);
      await repository.updateUser(id: user.id, isActive: true);
      ref.invalidate(usersProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${user.name} has been reactivated')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to reactivate user: $e')),
        );
      }
    }
  }

  // ── UI Helpers ──────────────────────────────────────────────────

  Widget _buildTextField(
    TextEditingController controller,
    String label,
    DesklineColors colors, {
    TextInputType? keyboardType,
    bool obscure = false,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: AppTypography.bodySmall.copyWith(color: colors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTypography.caption.copyWith(color: colors.textMuted),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: colors.borderColor),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: AppColors.primaryRed),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }

  Widget _buildDropdown<T extends Enum>({
    required String label,
    required T value,
    required List<T> items,
    required DesklineColors colors,
    required ValueChanged<T?> onChanged,
  }) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTypography.caption.copyWith(color: colors.textMuted),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.zero,
          borderSide: BorderSide(color: colors.borderColor),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          dropdownColor: colors.cardBackground,
          style: AppTypography.bodySmall.copyWith(color: colors.textPrimary),
          items: items.map((item) {
            return DropdownMenuItem<T>(
              value: item,
              child: Text(item.name.toUpperCase()),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
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
