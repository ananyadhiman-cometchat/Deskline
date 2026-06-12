import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/models/models.dart';

/// AnalyticsCards displays system-wide metrics.
/// Theme-aware — adapts card backgrounds and text colors.
class AnalyticsCards extends StatelessWidget {
  final TicketAnalytics analytics;

  const AnalyticsCards({
    super.key,
    required this.analytics,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildMetricsRow(context),
        const SizedBox(height: AppSpacing.lg),
        _buildDistributionSection(context),
      ],
    );
  }

  Widget _buildMetricsRow(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(context, 'Total Tickets', analytics.totalTickets.toString()),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildMetricCard(context, 'Active', analytics.activeTickets.toString()),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildMetricCard(context, 'Resolved', analytics.resolvedTickets.toString()),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildMetricCard(context, 'Escalated', analytics.escalatedTickets.toString()),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _buildMetricCard(context, 'Total Users', analytics.totalUsers.toString()),
        ),
      ],
    );
  }

  Widget _buildMetricCard(BuildContext context, String label, String value) {
    final colors = DesklineColors.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: colors.cardBackground,
        border: Border.all(color: colors.borderColor, width: 1),
        borderRadius: BorderRadius.zero,
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTypography.metricValue.copyWith(
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label.toUpperCase(),
            style: AppTypography.statsLabel.copyWith(
              color: colors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDistributionSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Distribution by Category'),
        const SizedBox(height: AppSpacing.md),
        _buildDistributionRow(context, analytics.byCategory),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'Distribution by Status'),
        const SizedBox(height: AppSpacing.md),
        _buildDistributionRow(context, analytics.byStatus),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'Distribution by Department'),
        const SizedBox(height: AppSpacing.md),
        _buildDistributionRow(context, analytics.byDepartment),
      ],
    );
  }

  Widget _buildDistributionRow(BuildContext context, Map<String, int> data) {
    final colors = DesklineColors.of(context);
    final total = data.values.fold(0, (sum, v) => sum + v);

    return Wrap(
      spacing: AppSpacing.xs,
      runSpacing: AppSpacing.xs,
      children: data.entries.map((e) {
        final percentage = total > 0 ? (e.value / total * 100).round() : 0;
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xxs,
          ),
          decoration: BoxDecoration(
            color: colors.surface,
            border: Border.all(color: colors.borderColor, width: 1),
            borderRadius: BorderRadius.zero,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                e.key.toUpperCase(),
                style: AppTypography.badge.copyWith(
                  color: colors.textPrimary,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                '$percentage%',
                style: AppTypography.badge.copyWith(
                  color: AppColors.primaryRed,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
