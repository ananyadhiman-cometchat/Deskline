import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/animations/page_transitions.dart';
import '../core/layout/main_scaffold.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/dashboard/presentation/employee_dashboard_screen.dart';
import '../features/dashboard/presentation/agent_dashboard_screen.dart';
import '../features/dashboard/presentation/supervisor_dashboard_screen.dart';
import '../features/dashboard/presentation/admin_dashboard_screen.dart';
import '../features/tickets/presentation/raise_ticket_screen.dart';
import '../features/tickets/presentation/ticket_detail_screen.dart';
import '../features/tickets/presentation/ticket_list_screen.dart';
import '../features/notifications/presentation/notification_center_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/agent/presentation/agent_inbox_screen.dart';
import '../features/supervisor/presentation/escalation_queue_screen.dart';
import '../features/supervisor/presentation/agent_load_view_screen.dart';
import '../features/supervisor/presentation/global_ticket_view_screen.dart';
import '../features/supervisor/presentation/ticket_reassignment_screen.dart';
import '../features/admin/presentation/user_management_screen.dart';
import '../features/admin/presentation/activity_logs_screen.dart';
import '../features/admin/presentation/notification_logs_screen.dart';
import '../features/admin/presentation/analytics_screen.dart';
import '../shared/enums/enums.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';
      final isRegisterRoute = state.matchedLocation == '/register';
      final isAuthRoute = isLoginRoute || isRegisterRoute;

      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      if (isAuthenticated && isAuthRoute) {
        return _dashboardForRole(authState.user!.role);
      }

      // Role-based route guard
      if (isAuthenticated && !isAuthRoute) {
        final role = authState.user!.role;
        final location = state.matchedLocation;

        // Shared routes accessible by all roles
        if (location == '/profile' || location == '/notifications' || location.startsWith('/tickets/')) {
          return null;
        }

        if (location.startsWith('/employee') && role != UserRole.employee) {
          return _dashboardForRole(role);
        }
        if (location.startsWith('/agent') && role != UserRole.agent) {
          return _dashboardForRole(role);
        }
        if (location.startsWith('/supervisor') && role != UserRole.supervisor) {
          return _dashboardForRole(role);
        }
        if (location.startsWith('/admin') && role != UserRole.admin) {
          return _dashboardForRole(role);
        }
      }

      return null;
    },
    routes: [
      // ─── Public Auth Routes (no shell) ────────────────────────
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // ─── Authenticated Routes (wrapped in MainScaffold shell) ─
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          // ─── Shared Routes (all roles) ─────────────────────
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),
          GoRoute(
            path: '/notifications',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: NotificationCenterScreen(),
            ),
          ),
          GoRoute(
            path: '/tickets/:id',
            pageBuilder: (context, state) => FadeSlideTransitionPage(
              child: TicketDetailScreen(
                ticketId: state.pathParameters['id']!,
              ),
            ),
          ),

          // ─── Employee Routes ──────────────────────────────────
          GoRoute(
            path: '/employee/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: EmployeeDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/employee/raise-ticket',
            pageBuilder: (context, state) => FadeSlideTransitionPage(
              child: const RaiseTicketScreen(),
            ),
          ),
          GoRoute(
            path: '/employee/tickets',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TicketListScreen(),
            ),
          ),
          GoRoute(
            path: '/employee/tickets/:id',
            pageBuilder: (context, state) => FadeSlideTransitionPage(
              child: TicketDetailScreen(
                ticketId: state.pathParameters['id']!,
              ),
            ),
          ),
          GoRoute(
            path: '/employee/notifications',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: NotificationCenterScreen(),
            ),
          ),
          GoRoute(
            path: '/employee/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),

          // ─── Agent Routes ─────────────────────────────────────
          GoRoute(
            path: '/agent/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AgentDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/agent/inbox',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AgentInboxScreen(),
            ),
          ),
          GoRoute(
            path: '/agent/tickets/:id',
            pageBuilder: (context, state) => FadeSlideTransitionPage(
              child: TicketDetailScreen(
                ticketId: state.pathParameters['id']!,
              ),
            ),
          ),

          // ─── Supervisor Routes ────────────────────────────────
          GoRoute(
            path: '/supervisor/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SupervisorDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/supervisor/tickets/:id',
            pageBuilder: (context, state) => FadeSlideTransitionPage(
              child: TicketDetailScreen(
                ticketId: state.pathParameters['id']!,
              ),
            ),
          ),
          GoRoute(
            path: '/supervisor/escalations',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: EscalationQueueScreen(),
            ),
          ),
          GoRoute(
            path: '/supervisor/agent-load',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AgentLoadViewScreen(),
            ),
          ),
          GoRoute(
            path: '/supervisor/tickets',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: GlobalTicketViewScreen(),
            ),
          ),
          GoRoute(
            path: '/supervisor/reassign',
            pageBuilder: (context, state) => FadeSlideTransitionPage(
              child: const TicketReassignmentScreen(),
            ),
          ),

          // ─── Admin Routes ─────────────────────────────────────
          GoRoute(
            path: '/admin/dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AdminDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/tickets',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TicketListScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/users',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: UserManagementScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/activity-logs',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ActivityLogsScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/notification-logs',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: NotificationLogsScreen(),
            ),
          ),
          GoRoute(
            path: '/admin/analytics',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AnalyticsScreen(),
            ),
          ),
        ],
      ),
    ],
  );
});

String _dashboardForRole(UserRole role) {
  switch (role) {
    case UserRole.employee:
      return '/employee/dashboard';
    case UserRole.agent:
      return '/agent/dashboard';
    case UserRole.supervisor:
      return '/supervisor/dashboard';
    case UserRole.admin:
      return '/admin/dashboard';
  }
}
