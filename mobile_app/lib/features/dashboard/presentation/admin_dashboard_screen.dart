import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../../shared/enums/ticket_status.dart';
import '../../../shared/services/refresh_service.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final tickets = ref.watch(ticketListProvider);

    return RefreshIndicator(
      onRefresh: () => RefreshService.refreshAll(ref),
      child: ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'COMMAND CENTRE',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Global system administration and oversight.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'SYSTEM METRICS'),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(child: MetricCard(label: 'Total', value: '${tickets.length}')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Open', value: '${tickets.where((e) => e.status == TicketStatus.open).length}')),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: MetricCard(label: 'Resolved', value: '${tickets.where((e) => e.status == TicketStatus.resolved).length}')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Escalated', value: '${tickets.where((e) => e.status == TicketStatus.escalated).length}')),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'QUICK ACTIONS'),
          const SizedBox(height: AppSpacing.md),
          _QuickNavTile(label: 'Users', icon: Icons.people_outline, route: '/admin/users', colors: colors),
          _QuickNavTile(label: 'Activity Logs', icon: Icons.history_outlined, route: '/admin/activity-logs', colors: colors),
          _QuickNavTile(label: 'Notification Logs', icon: Icons.notifications_outlined, route: '/admin/notification-logs', colors: colors),
          _QuickNavTile(label: 'Analytics', icon: Icons.analytics_outlined, route: '/admin/analytics', colors: colors),
        ],
      ),
    );
  }
}

class _QuickNavTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final String route;
  final DesklineColors colors;

  const _QuickNavTile({
    required this.label,
    required this.icon,
    required this.route,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go(route),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.xs),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: colors.cardBackground,
          border: Border.all(color: colors.borderColor, width: 1),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: colors.textMuted),
            const SizedBox(width: AppSpacing.md),
            Text(
              label.toUpperCase(),
              style: AppTypography.navigationLabel.copyWith(color: colors.textPrimary),
            ),
            const Spacer(),
            Icon(Icons.chevron_right, size: 20, color: colors.textMuted),
          ],
        ),
      ),
    );
  }
}
