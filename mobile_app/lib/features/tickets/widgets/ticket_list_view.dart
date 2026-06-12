import 'package:flutter/material.dart';

import '../../../core/theme/color_scheme.dart';
import '../../../core/theme/spacing.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'ticket_card.dart';

/// TicketListView displays tickets with filtering and pull-to-refresh.
class TicketListView extends StatelessWidget {
  final List<Ticket> tickets;
  final bool isLoading;
  final List<TicketStatus> visibleStatuses;
  final Future<void> Function()? onRefresh;
  final Function(Ticket)? onTicketTapped;

  const TicketListView({
    super.key,
    required this.tickets,
    this.isLoading = false,
    this.visibleStatuses = const [
      TicketStatus.open,
      TicketStatus.inProgress,
      TicketStatus.resolved,
      TicketStatus.closed,
    ],
    this.onRefresh,
    this.onTicketTapped,
  });

  @override
  Widget build(BuildContext context) {
    final filteredTickets = tickets.where((t) {
      if (visibleStatuses.isEmpty) return true;
      return visibleStatuses.contains(t.status);
    }).toList();

    return RefreshIndicator(
      onRefresh: onRefresh ?? () => Future.value(),
      color: AppColors.primaryRed,
      child: ListView.builder(
        padding: const EdgeInsets.only(top: AppSpacing.sm),
        itemCount: filteredTickets.length,
        itemBuilder: (context, index) {
          final ticket = filteredTickets[index];
          return TicketCard(
            ticket: ticket,
            onTap: () => onTicketTapped?.call(ticket),
          );
        },
      ),
    );
  }
}
