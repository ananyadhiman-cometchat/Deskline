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
    final inProgress = tickets.where((e) => e.status == TicketStatus.inProgress).length;
    final escalated = tickets.where((e) => e.status == TicketStatus.escalated).length;
    final resolved = tickets.where((e) => e.status == TicketStatus.resolved).length;
    final closed = tickets.where((e) => e.status == TicketStatus.closed).length;
    final total = tickets.length;

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

          // ─── Metrics ─────────────────────────────────────────
          const SectionHeader(title: 'QUEUE METRICS'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: MetricCard(label: 'Open', value: '$open')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Escalated', value: '$escalated')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Resolved', value: '$resolved')),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Status Distribution Bar Chart ───────────────────
          const SectionHeader(title: 'STATUS DISTRIBUTION'),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.cardBackground,
              border: Border.all(color: colors.borderColor, width: 1),
            ),
            child: Column(
              children: [
                _BarRow(label: 'Open', value: open, total: total, color: AppColors.statusOpen, colors: colors),
                _BarRow(label: 'In Progress', value: inProgress, total: total, color: AppColors.statusInProgress, colors: colors),
                _BarRow(label: 'Escalated', value: escalated, total: total, color: AppColors.statusEscalated, colors: colors),
                _BarRow(label: 'Resolved', value: resolved, total: total, color: AppColors.statusResolved, colors: colors),
                _BarRow(label: 'Closed', value: closed, total: total, color: AppColors.statusClosed, colors: colors),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Queue Health ────────────────────────────────────
          const SectionHeader(title: 'QUEUE HEALTH'),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: colors.cardBackground,
              border: Border(
                left: BorderSide(
                  color: escalated > 5 ? AppColors.errorRed : escalated > 2 ? AppColors.warningYellow : AppColors.successGreen,
                  width: 4,
                ),
                top: BorderSide(color: colors.borderColor, width: 1),
                right: BorderSide(color: colors.borderColor, width: 1),
                bottom: BorderSide(color: colors.borderColor, width: 1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  escalated > 5 ? Icons.error : escalated > 2 ? Icons.warning : Icons.check_circle,
                  color: escalated > 5 ? AppColors.errorRed : escalated > 2 ? AppColors.warningYellow : AppColors.successGreen,
                  size: 24,
                ),
                const SizedBox(width: AppSpacing.md),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      escalated > 5 ? 'CRITICAL' : escalated > 2 ? 'ELEVATED' : 'HEALTHY',
                      style: AppTypography.badge.copyWith(
                        color: escalated > 5 ? AppColors.errorRed : escalated > 2 ? AppColors.warningYellow : AppColors.successGreen,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$escalated escalated tickets in queue',
                      style: AppTypography.caption.copyWith(color: colors.textMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }
}

class _BarRow extends StatelessWidget {
  final String label;
  final int value;
  final int total;
  final Color color;
  final DesklineColors colors;

  const _BarRow({
    required this.label,
    required this.value,
    required this.total,
    required this.color,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final fraction = total > 0 ? value / total : 0.0;
    final percentage = (fraction * 100).round();

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label.toUpperCase(), style: AppTypography.badge.copyWith(color: colors.textPrimary)),
              Text('$value ($percentage%)', style: AppTypography.badge.copyWith(color: colors.textMuted)),
            ],
          ),
          const SizedBox(height: 6),
          LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                children: [
                  Container(
                    height: 8,
                    width: constraints.maxWidth,
                    decoration: BoxDecoration(
                      color: colors.borderColor,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 600),
                    curve: Curves.easeOut,
                    height: 8,
                    width: constraints.maxWidth * fraction,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
