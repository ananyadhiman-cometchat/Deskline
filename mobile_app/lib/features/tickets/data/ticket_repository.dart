import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';

abstract class TicketRepository {
  Future<Ticket> createTicket({
    required String title,
    required String description,
    required TicketCategory category,
    required TicketSubtype subType,
    required TicketPriority priority,
  });

  Future<PaginatedResponse<Ticket>> getTickets({
    int page = 1,
    int pageSize = 10,
    TicketStatus? status,
    TicketCategory? category,
    TicketPriority? priority,
    String? assignedToMe,
    String? search,
  });

  Future<Ticket> getTicketById(String id);

  Future<Ticket> updateTicketStatus({
    required String id,
    required TicketStatus status,
  });

  Future<Ticket> escalateTicket(String id);

  Future<Ticket> reassignTicket({
    required String id,
    required String agentId,
  });

  Future<Ticket> confirmResolution(String id);

  Future<Ticket> rejectResolution(String id);

  Future<Ticket> requestHumanHelp(String id);
}
