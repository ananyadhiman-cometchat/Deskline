import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../cometchat/providers/cometchat_provider.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/notifications/providers/notification_provider.dart';
import '../../shared/enums/enums.dart';
import '../../shared/models/models.dart';
import '../theme/color_scheme.dart';
import '../theme/theme_provider.dart';
import '../theme/typography.dart';
import '../utils/responsive.dart';

/// MainScaffold wraps authenticated screens with:
/// - A themed top bar (notification bell, user, theme toggle, logout)
/// - A bottom navigation bar (mobile) or navigation rail (tablet)
///
/// Matches the web's AppLayout pattern with sidebar + topbar.
/// On mobile: bottom nav with up to 5 items per role.
/// On tablet: NavigationRail on the left side.
class MainScaffold extends ConsumerStatefulWidget {
  final Widget child;

  const MainScaffold({super.key, required this.child});

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  @override
  void initState() {
    super.initState();
    // Initialize CometChat (Chat SDK + Calls SDK) once the authenticated
    // shell mounts. This MUST run before any chat/call feature is used —
    // calling CometChat.initiateCall before init throws the
    // "Please call the CometChat.init() method" error.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authStateProvider);
      if (authState.isAuthenticated) {
        ref.read(cometchatProvider.notifier).initialize();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final colors = DesklineColors.of(context);
    final user = authState.user;

    if (user == null) return widget.child;

    final navItems = _navItemsForRole(user.role);
    final currentIndex = _currentNavIndex(context, navItems);

    final isTablet = Responsive.isTablet(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: _buildTopBar(context, ref, colors, user),
      body: isTablet
          ? Row(
              children: [
                _buildNavigationRail(
                  context,
                  colors,
                  navItems,
                  currentIndex,
                ),
                const VerticalDivider(width: 1, thickness: 1),
                Expanded(child: _buildContent(context, colors, widget.child)),
              ],
            )
          : _buildContent(context, colors, widget.child),
      bottomNavigationBar: isTablet
          ? null
          : _buildBottomNav(context, colors, navItems, currentIndex),
    );
  }

  // ─── Top Bar ─────────────────────────────────────────────────────

  PreferredSizeWidget _buildTopBar(
    BuildContext context,
    WidgetRef ref,
    DesklineColors colors,
    User user,
  ) {
    final unreadCount = ref.watch(unreadCountProvider);
    final themeNotifier = ref.read(themeModeProvider.notifier);
    final isDark = ref.watch(themeModeProvider) == ThemeMode.dark;

    return PreferredSize(
      preferredSize: const Size.fromHeight(64),
      child: Container(
        height: 64 + MediaQuery.of(context).padding.top,
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        decoration: BoxDecoration(
          color: colors.background,
          border: Border(
            bottom: BorderSide(color: colors.borderColor, width: 1),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              // ─── Logo / Title
              RichText(
                text: TextSpan(
                  style: AppTypography.topbarTitle.copyWith(
                    color: colors.textPrimary,
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
              const Spacer(),

              // ─── Theme Toggle
              IconButton(
                onPressed: () => themeNotifier.toggle(),
                icon: Icon(
                  isDark ? Icons.wb_sunny_outlined : Icons.dark_mode_outlined,
                  size: 20,
                  color: colors.textMuted,
                ),
                tooltip: isDark ? 'Switch to light mode' : 'Switch to dark mode',
              ),

              // ─── Notification Bell
              _NotificationBell(
                unreadCount: unreadCount,
                colors: colors,
                onTap: () => _navigateToNotifications(context, user.role),
              ),
              const SizedBox(width: 8),

              // ─── User Button
              GestureDetector(
                onTap: () => _navigateToProfile(context, user.role),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: colors.borderColor, width: 1),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.person_outline, size: 14, color: colors.textPrimary),
                      const SizedBox(width: 6),
                      Text(
                        user.name.split(' ').first.toUpperCase(),
                        style: AppTypography.badge.copyWith(
                          color: colors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // ─── Logout
              IconButton(
                onPressed: () async {
                  await ref.read(authStateProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                icon: Icon(
                  Icons.logout,
                  size: 18,
                  color: colors.textMuted,
                ),
                tooltip: 'Logout',
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Bottom Navigation ───────────────────────────────────────────

  Widget _buildBottomNav(
    BuildContext context,
    DesklineColors colors,
    List<_NavItem> items,
    int currentIndex,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: colors.isDark ? AppColorsDark.background : AppColors.navy,
        border: Border(
          top: BorderSide(color: colors.borderColor, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final isActive = index == currentIndex;

              return Expanded(
                child: GestureDetector(
                  onTap: () => context.go(item.route),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Active indicator line
                      Container(
                        height: 3,
                        width: 24,
                        color: isActive
                            ? AppColors.primaryRed
                            : Colors.transparent,
                      ),
                      const SizedBox(height: 6),
                      Icon(
                        item.icon,
                        size: 22,
                        color: isActive
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.label.toUpperCase(),
                        style: AppTypography.sidebarSectionLabel.copyWith(
                          color: isActive
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.4),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  // ─── Navigation Rail (Tablet) ────────────────────────────────────

  Widget _buildNavigationRail(
    BuildContext context,
    DesklineColors colors,
    List<_NavItem> items,
    int currentIndex,
  ) {
    return Container(
      width: 72,
      color: colors.isDark ? AppColorsDark.background : AppColors.navy,
      child: Column(
        children: [
          const SizedBox(height: 16),
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isActive = index == currentIndex;

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: GestureDetector(
                onTap: () => context.go(item.route),
                child: Container(
                  width: 56,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isActive
                        ? AppColors.primaryRed.withValues(alpha: 0.12)
                        : Colors.transparent,
                    border: Border(
                      left: BorderSide(
                        color: isActive
                            ? AppColors.primaryRed
                            : Colors.transparent,
                        width: 3,
                      ),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        item.icon,
                        size: 22,
                        color: isActive
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.shortLabel.toUpperCase(),
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: isActive
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.4),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // ─── Content Area ────────────────────────────────────────────────

  Widget _buildContent(BuildContext context, DesklineColors colors, Widget child) {
    return Padding(
      padding: EdgeInsets.all(Responsive.pagePadding(context)),
      child: child,
    );
  }

  // ─── Navigation Items Per Role ───────────────────────────────────

  List<_NavItem> _navItemsForRole(UserRole role) {
    switch (role) {
      case UserRole.employee:
        return const [
          _NavItem(label: 'Dashboard', shortLabel: 'Home', icon: Icons.dashboard_outlined, route: '/employee/dashboard'),
          _NavItem(label: 'Tickets', shortLabel: 'Tickets', icon: Icons.confirmation_number_outlined, route: '/employee/tickets'),
          _NavItem(label: 'New Ticket', shortLabel: 'New', icon: Icons.add_circle_outline, route: '/employee/raise-ticket'),
          _NavItem(label: 'Alerts', shortLabel: 'Alerts', icon: Icons.notifications_outlined, route: '/notifications'),
          _NavItem(label: 'Profile', shortLabel: 'Profile', icon: Icons.person_outline, route: '/profile'),
        ];
      case UserRole.agent:
        return const [
          _NavItem(label: 'Dashboard', shortLabel: 'Home', icon: Icons.dashboard_outlined, route: '/agent/dashboard'),
          _NavItem(label: 'Inbox', shortLabel: 'Inbox', icon: Icons.inbox_outlined, route: '/agent/inbox'),
          _NavItem(label: 'Alerts', shortLabel: 'Alerts', icon: Icons.notifications_outlined, route: '/notifications'),
          _NavItem(label: 'Profile', shortLabel: 'Profile', icon: Icons.person_outline, route: '/profile'),
        ];
      case UserRole.supervisor:
        return const [
          _NavItem(label: 'Dashboard', shortLabel: 'Home', icon: Icons.dashboard_outlined, route: '/supervisor/dashboard'),
          _NavItem(label: 'My Tickets', shortLabel: 'Mine', icon: Icons.person_outline, route: '/supervisor/my-tickets'),
          _NavItem(label: 'All Tickets', shortLabel: 'Tickets', icon: Icons.list_alt_outlined, route: '/supervisor/tickets'),
          _NavItem(label: 'Escalations', shortLabel: 'Escalate', icon: Icons.warning_amber_outlined, route: '/supervisor/escalations'),
          _NavItem(label: 'Agent Load', shortLabel: 'Agents', icon: Icons.people_outline, route: '/supervisor/agent-load'),
        ];
      case UserRole.admin:
        return const [
          _NavItem(label: 'Dashboard', shortLabel: 'Home', icon: Icons.dashboard_outlined, route: '/admin/dashboard'),
          _NavItem(label: 'Tickets', shortLabel: 'Tickets', icon: Icons.list_alt_outlined, route: '/admin/tickets'),
          _NavItem(label: 'Users', shortLabel: 'Users', icon: Icons.people_outline, route: '/admin/users'),
          _NavItem(label: 'Analytics', shortLabel: 'Stats', icon: Icons.analytics_outlined, route: '/admin/analytics'),
        ];
    }
  }

  int _currentNavIndex(BuildContext context, List<_NavItem> items) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < items.length; i++) {
      if (location.startsWith(items[i].route)) return i;
    }
    return 0;
  }

  void _navigateToNotifications(BuildContext context, UserRole role) {
    context.go('/notifications');
  }

  void _navigateToProfile(BuildContext context, UserRole role) {
    context.go('/profile');
  }
}

// ─── Notification Bell Widget ──────────────────────────────────────

class _NotificationBell extends StatelessWidget {
  final int unreadCount;
  final DesklineColors colors;
  final VoidCallback onTap;

  const _NotificationBell({
    required this.unreadCount,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: colors.background,
          border: Border.all(color: colors.borderColor, width: 1),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Center(
              child: Icon(
                Icons.notifications_outlined,
                size: 18,
                color: colors.textPrimary,
              ),
            ),
            if (unreadCount > 0)
              Positioned(
                top: -4,
                right: -4,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: const BoxDecoration(
                    color: AppColors.primaryRed,
                  ),
                  child: Center(
                    child: Text(
                      unreadCount > 99 ? '99+' : '$unreadCount',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Nav Item Model ────────────────────────────────────────────────

class _NavItem {
  final String label;
  final String shortLabel;
  final IconData icon;
  final String route;

  const _NavItem({
    required this.label,
    required this.shortLabel,
    required this.icon,
    required this.route,
  });
}
