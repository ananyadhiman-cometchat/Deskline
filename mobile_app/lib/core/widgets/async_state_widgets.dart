import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../errors/error_utils.dart';
import '../theme/color_scheme.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// A centered loading indicator matching the app's design language.
class AppLoadingIndicator extends StatelessWidget {
  final String? message;

  const AppLoadingIndicator({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor:
                    AlwaysStoppedAnimation<Color>(colors.primaryRed),
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                message!,
                style: AppTypography.bodySmall.copyWith(
                  color: colors.textMuted,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// A centered error display with optional retry button.
class AppErrorWidget extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;

  const AppErrorWidget({super.key, required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    final message = getUserFriendlyError(error);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              color: colors.primaryRed,
              size: 32,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              message,
              style: AppTypography.bodySmall.copyWith(
                color: colors.textMuted,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.lg),
              TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(
                  foregroundColor: colors.primaryRed,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero,
                  ),
                ),
                child: Text(
                  'RETRY',
                  style: AppTypography.navigationLabel.copyWith(
                    color: colors.primaryRed,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Helper extension for using AsyncValue with standard loading/error widgets.
extension AsyncValueUI<T> on AsyncValue<T> {
  /// Renders loading, error, or data states using the app's standard widgets.
  Widget buildWith({
    required Widget Function(T data) data,
    Widget Function()? loading,
    Widget Function(Object error, StackTrace stackTrace)? error,
    VoidCallback? onRetry,
  }) {
    return when(
      loading: () => loading?.call() ?? const AppLoadingIndicator(),
      error: (e, st) =>
          error?.call(e, st) ?? AppErrorWidget(error: e, onRetry: onRetry),
      data: data,
    );
  }
}
