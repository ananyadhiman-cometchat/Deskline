import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/error_utils.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../providers/auth_provider.dart';
import 'auth_layout.dart';

/// RegisterScreen — dark tactical registration flow matching the web's style.
///
/// Features:
/// - DeskLine logo with red accent
/// - "REQUEST CLEARANCE" title
/// - "Submit credentials to be granted access" subtitle
/// - Dark-themed inputs
/// - "DEPLOY CREDENTIALS" CTA button
/// - "Already have access? Authenticate" footer
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedDepartment = 'General';
  bool _isLoading = false;
  String? _error;

  static const _departments = ['IT', 'HR', 'General'];

  void _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authStateProvider.notifier).register(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            password: _passwordController.text,
            department: _selectedDepartment,
          );
      // Auth state changes trigger router redirect to the correct dashboard.
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = getUserFriendlyError(e);
        });
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── Logo ─────────────────────────────────────────
            const AuthLogo(),
            const SizedBox(height: AppSpacing.xl),

            // ─── Title ────────────────────────────────────────
            Center(
              child: Text(
                'REQUEST CLEARANCE',
                style: AppTypography.authTitle.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),

            // ─── Subtitle ─────────────────────────────────────
            Center(
              child: Text(
                'Submit credentials to be granted system access.',
                style: AppTypography.bodySmall.copyWith(
                  color: Colors.white.withValues(alpha: 0.5),
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // ─── Error Banner ─────────────────────────────────
            if (_error != null) ...[
              AuthErrorMessage(message: _error!),
              const SizedBox(height: AppSpacing.lg),
            ],

            // ─── Name Field ───────────────────────────────────
            AuthTextField(
              label: 'Full Name',
              controller: _nameController,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Full name required';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ─── Email Field ──────────────────────────────────
            AuthTextField(
              label: 'Email Address',
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Email address required';
                }
                if (!value.contains('@')) {
                  return 'Enter a valid email address';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ─── Password Field ───────────────────────────────
            AuthTextField(
              label: 'Password',
              controller: _passwordController,
              obscureText: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Password required';
                }
                if (value.length < 8) {
                  return 'Minimum 8 characters required';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.md),

            // ─── Department Selector ──────────────────────────
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DEPARTMENT',
                  style: AppTypography.formLabel.copyWith(
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.07),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.15),
                      width: 1,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedDepartment,
                      isExpanded: true,
                      dropdownColor: const Color(0xFF1A1A2E),
                      style: AppTypography.bodySmall.copyWith(
                        color: Colors.white,
                      ),
                      icon: Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.white.withValues(alpha: 0.5),
                      ),
                      items: _departments.map((dept) {
                        return DropdownMenuItem(
                          value: dept,
                          child: Text(dept),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _selectedDepartment = value);
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xl),

            // ─── Submit Button ────────────────────────────────
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero,
                  ),
                  textStyle: AppTypography.navigationLabel,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('DEPLOY CREDENTIALS'),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // ─── Footer ───────────────────────────────────────
            Container(
              padding: const EdgeInsets.only(top: AppSpacing.lg),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withValues(alpha: 0.1),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already have access? ',
                    style: AppTypography.bodySmall.copyWith(
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text(
                      'Authenticate',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.primaryRed,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
