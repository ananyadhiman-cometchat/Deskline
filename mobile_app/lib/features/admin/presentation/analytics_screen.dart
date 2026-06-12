import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/admin_provider.dart';

/// Analytics screen with metric cards and visual bar chart distributions.
class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = DesklineColors.of(context);
    final analytics = ref.watch(ticketAnalyticsProvider);

    return analytics.when(
      data: (data) => ListView(
        children: [
          const SizedBox(height: AppSpacing.lg),
          Text(
            'ANALYTICS',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Ticket distribution and system metrics.',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Metrics Row ────────────────────────────────────
          const SectionHeader(title: 'OVERVIEW'),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: MetricCard(label: 'Total', value: '${data.totalTickets}')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Active', value: '${data.activeTickets}')),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(child: MetricCard(label: 'Resolved', value: '${data.resolvedTickets}')),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: MetricCard(label: 'Escalated', value: '${data.escalatedTickets}')),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Status Distribution Chart ──────────────────────
          const SectionHeader(title: 'BY STATUS'),
          const SizedBox(height: AppSpacing.sm),
          _BarChart(
            data: data.byStatus,
            colorMap: {
              'open': AppColors.statusOpen,
              'in_progress': AppColors.statusInProgress,
              'escalated': AppColors.statusEscalated,
              'resolved': AppColors.statusResolved,
              'closed': AppColors.statusClosed,
            },
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Category Distribution Chart ────────────────────
          const SectionHeader(title: 'BY CATEGORY'),
          const SizedBox(height: AppSpacing.sm),
          _BarChart(
            data: data.byCategory,
            colorMap: {
              'IT': const Color(0xFF3B82F6),
              'HR': const Color(0xFFF59E0B),
              'General': const Color(0xFF10B981),
            },
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.xl),

          // ─── Department Distribution Chart ──────────────────
          const SectionHeader(title: 'BY DEPARTMENT'),
          const SizedBox(height: AppSpacing.sm),
          _BarChart(
            data: data.byDepartment,
            colorMap: {
              'IT': const Color(0xFF6366F1),
              'HR': const Color(0xFFEC4899),
              'General': const Color(0xFF14B8A6),
            },
            colors: colors,
          ),
          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryRed)),
      error: (e, s) => Center(
        child: Text('Error loading analytics', style: AppTypography.body.copyWith(color: AppColors.errorRed)),
      ),
    );
  }
}

/// Simple horizontal bar chart matching tactical design.
class _BarChart extends StatelessWidget {
  final Map<String, int> data;
  final Map<String, Color> colorMap;
  final DesklineColors colors;

  const _BarChart({
    required this.data,
    required this.colorMap,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final total = data.values.fold(0, (sum, v) => sum + v);
    if (total == 0) return const SizedBox.shrink();

    final maxValue = data.values.reduce((a, b) => a > b ? a : b);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
      ),
      child: Column(
        children: data.entries.map((entry) {
          final percentage = (entry.value / total * 100).round();
          final barWidth = maxValue > 0 ? entry.value / maxValue : 0.0;
          final barColor = colorMap[entry.key] ?? AppColors.primaryRed;

          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key.toUpperCase(),
                      style: AppTypography.badge.copyWith(color: colors.textPrimary),
                    ),
                    Text(
                      '${entry.value} ($percentage%)',
                      style: AppTypography.badge.copyWith(color: colors.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // Bar
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
                          width: constraints.maxWidth * barWidth,
                          decoration: BoxDecoration(
                            color: barColor,
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
        }).toList(),
      ),
    );
  }
}
