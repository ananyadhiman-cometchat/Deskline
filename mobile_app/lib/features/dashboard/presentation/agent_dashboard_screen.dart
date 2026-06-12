import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../tickets/widgets/ticket_card.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/services/refresh_service.dart';

class AgentDashboardScreen extends ConsumerWidget {
  const AgentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final tickets = ref.watch(ticketListProvider);
    final assigned = tickets.where((t) => t.agentId != null).take(5).toList();
    final newAssignments = tickets.where((t) => t.status == TicketStatus.open).take(3).toList();

    return RefreshIndicator(
      onRefresh: RefreshService.simulateRefresh,
      child: ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'AGENT DASHBOARD',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Your assigned tickets and workload overview.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),
          Row(
            children: [
              _StatChip(label: 'Assigned', value: '${assigned.length}', colors: colors),
              const SizedBox(width: AppSpacing.sm),
              _StatChip(label: 'New', value: '${newAssignments.length}', colors: colors),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          const SectionHeader(title: 'ASSIGNED TICKETS'),
          const SizedBox(height: AppSpacing.md),
          ...assigned.map((t) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: TicketCard(ticket: t),
          )),
          if (assigned.isEmpty)
            Text(
              'No tickets assigned.',
              style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
            ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final DesklineColors colors;

  const _StatChip({required this.label, required this.value, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value, style: AppTypography.metricValue.copyWith(color: colors.textPrimary)),
          const SizedBox(width: 8),
          Text(label.toUpperCase(), style: AppTypography.statsLabel.copyWith(color: colors.textMuted)),
        ],
      ),
    );
  }
}
