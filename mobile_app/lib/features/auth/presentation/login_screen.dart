import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors/error_utils.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../providers/auth_provider.dart';
import 'auth_layout.dart';

/// LoginScreen — dark tactical auth flow matching the web's login page.
///
/// Features:
/// - DeskLine logo with red accent
/// - "SYSTEM ACCESS" title in Bebas Neue
/// - "Authenticate to access the operational support matrix" subtitle
/// - Dark-themed inputs (transparent bg, white text)
/// - "INITIALISE PROTOCOL" CTA button
/// - "Do not have an access code? Request Clearance" footer
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authStateProvider.notifier).login(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
      // Router handles redirection via auth state redirect rules
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
                'SYSTEM ACCESS',
                style: AppTypography.authTitle.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xs),

            // ─── Subtitle ─────────────────────────────────────
            Center(
              child: Text(
                'Authenticate to access the operational support matrix.',
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
            const SizedBox(height: AppSpacing.lg),

            // ─── Password Field ───────────────────────────────
            AuthTextField(
              label: 'Password',
              controller: _passwordController,
              obscureText: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Password required';
                }
                return null;
              },
            ),
            const SizedBox(height: AppSpacing.xl),

            // ─── Submit Button ────────────────────────────────
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
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
                    : const Text('INITIALISE PROTOCOL'),
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
              child: Wrap(
                alignment: WrapAlignment.center,
                children: [
                  Text(
                    'Do not have an access code? ',
                    style: AppTypography.bodySmall.copyWith(
                      color: Colors.white.withValues(alpha: 0.45),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/register'),
                    child: Text(
                      'Request Clearance',
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
