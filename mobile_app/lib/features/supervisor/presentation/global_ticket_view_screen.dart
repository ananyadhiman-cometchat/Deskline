import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../tickets/widgets/ticket_card.dart';

class GlobalTicketViewScreen extends ConsumerWidget {
  const GlobalTicketViewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tickets = ref.watch(ticketListProvider);

    return AppShell(
      child: ListView(
        children: [
          const SectionHeader(title: 'GLOBAL TICKETS'),
          ...tickets.map((t) => TicketCard(
                ticket: t,
                onTap: () => context.go('/supervisor/tickets/${t.id}'),
              )),
        ],
      ),
    );
  }
}
