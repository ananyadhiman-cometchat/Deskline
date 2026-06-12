import 'package:flutter/material.dart';

/// AppShell is now a thin wrapper that just passes through its child.
///
/// Previously it wrapped content in a Scaffold with padding.
/// Now that MainScaffold (via ShellRoute) handles the outer Scaffold,
/// app bar, and padding, AppShell simply returns the child directly.
///
/// Kept as a no-op wrapper so existing screen imports don't break.
/// Screens can gradually remove it as they are refactored.
class AppShell extends StatelessWidget {
  final Widget child;

  const AppShell({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
