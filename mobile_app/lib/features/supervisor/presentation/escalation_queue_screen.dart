import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/section_header.dart';
import '../../../shared/enums/ticket_status.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../tickets/widgets/ticket_card.dart';

class EscalationQueueScreen extends ConsumerWidget {
  const EscalationQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final escalated = ref
        .watch(ticketListProvider)
        .where((t) => t.status == TicketStatus.escalated)
        .toList();

    return AppShell(
      child: ListView(
        children: [
          const SectionHeader(title: 'ESCALATION QUEUE'),
          if (escalated.isEmpty)
            const EmptyState(message: 'No escalated tickets')
          else
            ...escalated.map((e) => TicketCard(ticket: e)),
        ],
      ),
    );
  }
}
