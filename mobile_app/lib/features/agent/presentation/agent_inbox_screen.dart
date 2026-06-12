import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/layout/app_shell.dart';
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
  TicketStatus? status;

  @override
  Widget build(BuildContext context) {
    var tickets = ref.watch(ticketListProvider);

    if (status != null) {
      tickets = tickets.where((e) => e.status == status).toList();
    }

    return AppShell(
      child: Column(
        children: [
          const SectionHeader(title: 'AGENT INBOX'),
          DropdownButton<TicketStatus?>(
            value: status,
            hint: const Text('Filter Status'),
            onChanged: (v) => setState(() => status = v),
            items: [
              const DropdownMenuItem(value: null, child: Text('All')),
              ...TicketStatus.values.map(
                (e) => DropdownMenuItem(value: e, child: Text(e.name)),
              ),
            ],
          ),
          Expanded(
            child: tickets.isEmpty
                ? const EmptyState(message: 'No tickets found')
                : ListView(
                    children: tickets.map((e) => TicketCard(ticket: e)).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}
