import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/app_shell.dart';
import '../../../core/widgets/section_header.dart';
import '../../auth/providers/auth_provider.dart';
import '../../tickets/providers/ticket_provider.dart';
import '../../tickets/widgets/ticket_card.dart';

class SupervisorMyTicketsScreen extends ConsumerWidget {
  const SupervisorMyTicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    
    // Fallback if user is somehow null (should be caught by auth guard)
    if (user == null) return const SizedBox.shrink();

    // Fetch tickets specifically assigned to this supervisor
    final ticketsAsync = ref.watch(ticketsProvider(TicketListParams(agentId: user.id)));

    return AppShell(
      child: ListView(
        children: [
          const SectionHeader(title: 'MY TICKETS'),
          ticketsAsync.when(
            data: (response) {
              if (response.data.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Center(
                    child: Text(
                      'No tickets assigned to you.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                );
              }
              return Column(
                children: response.data
                    .map((t) => TicketCard(
                          ticket: t,
                          onTap: () => context.go('/supervisor/tickets/${t.id}'),
                        ))
                    .toList(),
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.all(32.0),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (err, stack) => Padding(
              padding: const EdgeInsets.all(32.0),
              child: Center(
                child: Text('Error loading tickets: $err'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
