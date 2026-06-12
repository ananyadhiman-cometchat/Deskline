import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/dio_provider.dart';
import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import '../../../shared/services/environment_provider.dart';
import '../data/api_ticket_repository.dart';
import '../data/mock_ticket_repository.dart';
import '../data/ticket_api_service.dart';
import '../data/ticket_repository.dart';

// Repository provider
final ticketRepositoryProvider = Provider<TicketRepository>((ref) {
  if (ref.watch(dataSourceProvider) == DataSource.api) {
    final dioClient = ref.watch(dioClientProvider);
    return ApiTicketRepository(apiService: TicketApiService(dioClient));
  }
  return MockTicketRepository();
});

// Ticket list provider (paginated)
final ticketsProvider = FutureProvider.family<PaginatedResponse<Ticket>,
    TicketListParams>((ref, params) async {
  final repository = ref.watch(ticketRepositoryProvider);
  return repository.getTickets(
    page: params.page,
    pageSize: params.pageSize,
    status: params.status,
    category: params.category,
    priority: params.priority,
  );
});

// Default ticket list (first page, no filters)
final defaultTicketsProvider = FutureProvider<List<Ticket>>((ref) async {
  final repository = ref.watch(ticketRepositoryProvider);
  final response = await repository.getTickets();
  return response.data;
});

// Simplified synchronous provider for widget consumption
final ticketListProvider = Provider<List<Ticket>>((ref) {
  final tickets = ref.watch(defaultTicketsProvider);
  return tickets.valueOrNull ?? [];
});

// Single ticket detail provider
final ticketDetailProvider =
    FutureProvider.family<Ticket, String>((ref, id) async {
  final repository = ref.watch(ticketRepositoryProvider);
  return repository.getTicketById(id);
});

/// Parameters for filtered/paginated ticket queries
class TicketListParams {
  final int page;
  final int pageSize;
  final TicketStatus? status;
  final TicketCategory? category;
  final TicketPriority? priority;

  const TicketListParams({
    this.page = 1,
    this.pageSize = 20,
    this.status,
    this.category,
    this.priority,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TicketListParams &&
          page == other.page &&
          pageSize == other.pageSize &&
          status == other.status &&
          category == other.category &&
          priority == other.priority;

  @override
  int get hashCode => Object.hash(page, pageSize, status, category, priority);
}
