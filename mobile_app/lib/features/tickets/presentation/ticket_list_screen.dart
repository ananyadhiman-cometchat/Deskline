import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../shared/enums/enums.dart';
import '../providers/ticket_provider.dart';
import '../widgets/ticket_card.dart';

/// TicketListScreen shows all tickets for the current user with
/// search and filter controls matching the web's TicketFilters component.
class TicketListScreen extends ConsumerStatefulWidget {
  const TicketListScreen({super.key});

  @override
  ConsumerState<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends ConsumerState<TicketListScreen> {
  TicketStatus? _statusFilter;
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    var tickets = ref.watch(ticketListProvider);

    // Apply filters
    if (_statusFilter != null) {
      tickets = tickets.where((e) => e.status == _statusFilter).toList();
    }
    if (_query.isNotEmpty) {
      tickets = tickets
          .where((e) => e.title.toLowerCase().contains(_query.toLowerCase()))
          .toList();
    }

    return RefreshIndicator(
      onRefresh: () async {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: AppSpacing.lg),

          // Page Header
          Text(
            'MY TICKETS',
            style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${tickets.length} tickets found',
            style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
          ),
          const SizedBox(height: AppSpacing.lg),

          // ─── Filters Row ──────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: colors.cardBackground,
              border: Border.all(color: colors.borderColor, width: 1),
            ),
            child: Row(
              children: [
                // Search field
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: TextField(
                      onChanged: (v) => setState(() => _query = v),
                      style: AppTypography.bodySmall.copyWith(
                        color: colors.textPrimary,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Search tickets...',
                        hintStyle: AppTypography.bodySmall.copyWith(
                          color: colors.textMuted,
                        ),
                        prefixIcon: Icon(
                          Icons.search,
                          size: 18,
                          color: colors.textMuted,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide(color: colors.borderColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide(color: colors.borderColor),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide(color: AppColors.primaryRed),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),

                // Status filter chips
                _FilterChip(
                  label: _statusFilter?.name ?? 'All',
                  isActive: _statusFilter != null,
                  colors: colors,
                  onTap: () => _showStatusFilter(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // ─── Ticket List ──────────────────────────────────────
          Expanded(
            child: tickets.isEmpty
                ? const Center(
                    child: EmptyState(
                      message: 'No tickets match your filters.',
                      icon: Icons.search_off,
                    ),
                  )
                : ListView.separated(
                    itemCount: tickets.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      final ticket = tickets[index];
                      return TicketCard(
                        ticket: ticket,
                        onTap: () =>
                            context.go('/tickets/${ticket.id}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showStatusFilter(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: DesklineColors.of(context).cardBackground,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
      builder: (ctx) {
        final colors = DesklineColors.of(ctx);
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Text(
                  'FILTER BY STATUS',
                  style: AppTypography.sectionLabel.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
              ),
              Divider(height: 1, color: colors.borderColor),
              _filterOption(ctx, null, 'All Statuses'),
              ...TicketStatus.values.map(
                (s) => _filterOption(ctx, s, s.name.toUpperCase()),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _filterOption(BuildContext ctx, TicketStatus? status, String label) {
    final colors = DesklineColors.of(ctx);
    final isSelected = _statusFilter == status;

    return GestureDetector(
      onTap: () {
        setState(() => _statusFilter = status);
        Navigator.pop(ctx);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: 14,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primaryRed.withValues(alpha: 0.06)
              : Colors.transparent,
          border: Border(
            left: BorderSide(
              color: isSelected ? AppColors.primaryRed : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          label,
          style: AppTypography.navigationLabel.copyWith(
            color: isSelected ? AppColors.primaryRed : colors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final DesklineColors colors;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isActive,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 36,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primaryRed.withValues(alpha: 0.08)
              : colors.cardBackground,
          border: Border.all(
            color: isActive ? AppColors.primaryRed : colors.borderColor,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.filter_list,
              size: 14,
              color: isActive ? AppColors.primaryRed : colors.textMuted,
            ),
            const SizedBox(width: 6),
            Text(
              label.toUpperCase(),
              style: AppTypography.badge.copyWith(
                color: isActive ? AppColors.primaryRed : colors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
