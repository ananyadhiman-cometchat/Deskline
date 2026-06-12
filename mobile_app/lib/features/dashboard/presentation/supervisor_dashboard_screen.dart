import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../../shared/enums/ticket_status.dart';
import '../../../shared/services/refresh_service.dart';

class SupervisorDashboardScreen extends ConsumerWidget {
  const SupervisorDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final tickets = ref.watch(ticketListProvider);
    final open = tickets.where((e) => e.status == TicketStatus.open).length;
    final escalated = tickets.where((e) => e.status == TicketStatus.escalated).length;
    final resolved = tickets.where((e) => e.status == TicketStatus.resolved).length;

    return RefreshIndicator(
      onRefresh: RefreshService.simulateRefresh,
      child: ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'SUPERVISOR DASHBOARD',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Team oversight and escalation management.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'QUEUE METRICS'),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(child: MetricCard(label: 'Open', value: '$open')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Escalated', value: '$escalated')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Resolved', value: '$resolved')),
            ],
          ),
        ],
      ),
    );
  }
}
