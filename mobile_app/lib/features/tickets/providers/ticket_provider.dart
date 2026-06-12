import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_ticket_repository.dart';
import '../data/api_ticket_repository.dart';
import '../data/ticket_repository.dart';
import '../../../shared/models/models.dart';
import '../../../shared/services/environment_provider.dart';

// Repository provider
final ticketRepositoryProvider = Provider<TicketRepository>((ref) {
  return ref.watch(dataSourceProvider)==DataSource.api
      ? ApiTicketRepository()
      : MockTicketRepository();
});

// Ticket list provider
final ticketsProvider = FutureProvider<List<Ticket>>((ref) async {
  final repository = ref.watch(ticketRepositoryProvider);
  final response = await repository.getTickets();
  return response.data;
});

// Simplified synchronous provider for widget consumption
final ticketListProvider = Provider<List<Ticket>>((ref) {
  final tickets = ref.watch(ticketsProvider);
  return tickets.valueOrNull ?? [];
});