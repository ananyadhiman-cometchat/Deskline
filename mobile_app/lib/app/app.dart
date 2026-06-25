import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../cometchat/widgets/incoming_call_widget.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/color_scheme.dart';
import '../core/theme/theme_provider.dart';
import '../features/auth/providers/auth_provider.dart';
import 'router.dart';

class DesklineApp extends ConsumerWidget {
  const DesklineApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final authState = ref.watch(authStateProvider);

    return MaterialApp.router(
      title: 'DeskLine',
      theme: buildAppTheme(),
      darkTheme: buildDarkAppTheme(),
      themeMode: themeMode,
      themeAnimationDuration: const Duration(milliseconds: 200),
      themeAnimationCurve: Curves.easeOut,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      // Show a splash while auth state is loading from secure storage.
      // This covers the window between app start and when _initialize()
      // completes — the same window where the notification permission
      // dialog can appear and resolve, causing a white screen.
      builder: (context, child) {
        if (!authState.isInitialized) {
          return const _SplashScreen();
        }
        // Mount IncomingCallWidget at the root level so incoming calls
        // ring regardless of the current page/route.
        return IncomingCallWidget(
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}

/// Minimal branded splash shown while [AuthState.isInitialized] is false.
/// Matches the auth layout's dark colour palette.
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050A10),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ─── Branded logo ─────────────────────────────────
            RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontFamily: 'BebasNeue',
                  fontSize: 40,
                  letterSpacing: 4,
                  color: Colors.white,
                ),
                children: [
                  const TextSpan(text: 'DESK'),
                  TextSpan(
                    text: 'LINE',
                    style: TextStyle(color: AppColors.primaryRed),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // ─── Loading indicator ────────────────────────────
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRed),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
