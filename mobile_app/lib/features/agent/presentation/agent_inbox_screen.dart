import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/enums/enums.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../tickets/widgets/ticket_card.dart';

class AgentInboxScreen extends ConsumerStatefulWidget {
  const AgentInboxScreen({super.key});

  @override
  ConsumerState<AgentInboxScreen> createState() => _AgentInboxScreenState();
}

class _AgentInboxScreenState extends ConsumerState<AgentInboxScreen> {
  TicketStatus? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final colors = DesklineColors.of(context);
    var tickets = ref.watch(ticketListProvider);

    if (_statusFilter != null) {
      tickets = tickets.where((e) => e.status == _statusFilter).toList();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.lg),
        Text(
          'AGENT INBOX',
          style: AppTypography.pageHeader.copyWith(color: colors.textPrimary),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          '${tickets.length} tickets in queue.',
          style: AppTypography.bodySmall.copyWith(color: colors.textMuted),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Filter chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip(null, 'All', colors),
              const SizedBox(width: AppSpacing.xs),
              ...TicketStatus.values.map((s) => Padding(
                padding: const EdgeInsets.only(right: AppSpacing.xs),
                child: _buildFilterChip(s, s.name.toUpperCase(), colors),
              )),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        const SectionHeader(title: 'TICKETS'),
        const SizedBox(height: AppSpacing.sm),

        Expanded(
          child: tickets.isEmpty
              ? const EmptyState(message: 'No tickets match your filter.', icon: Icons.inbox_outlined)
              : ListView.separated(
                  itemCount: tickets.length,
                  separatorBuilder: (_, i) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final ticket = tickets[index];
                    return TicketCard(
                      ticket: ticket,
                      onTap: () => context.go('/agent/tickets/${ticket.id}'),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(TicketStatus? status, String label, DesklineColors colors) {
    final isActive = _statusFilter == status;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = status),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryRed.withValues(alpha: 0.1) : colors.cardBackground,
          border: Border.all(
            color: isActive ? AppColors.primaryRed : colors.borderColor,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.badge.copyWith(
            color: isActive ? AppColors.primaryRed : colors.textPrimary,
          ),
        ),
      ),
    );
  }
}
