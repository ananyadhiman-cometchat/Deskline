import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import '../dto/create_ticket_request_dto.dart';
import 'ticket_api_service.dart';
import 'ticket_repository.dart';

class ApiTicketRepository implements TicketRepository {
  final TicketApiService _apiService;

  ApiTicketRepository({required TicketApiService apiService})
      : _apiService = apiService;

  @override
  Future<Ticket> createTicket({
    required String title,
    required String description,
    required TicketCategory category,
    required TicketSubtype subType,
    required TicketPriority priority,
  }) async {
    final response = await _apiService.createTicket(
      CreateTicketRequestDto(
        title: title,
        description: description,
        category: _categoryToString(category),
        subType: _subtypeToString(subType),
        priority: _priorityToString(priority),
      ),
    );

    // Backend returns { data: ticket }
    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<PaginatedResponse<Ticket>> getTickets({
    int page = 1,
    int pageSize = 10,
    TicketStatus? status,
    TicketCategory? category,
    TicketPriority? priority,
    String? assignedToMe,
    String? search,
    String? agentId,
  }) async {
    final response = await _apiService.getTickets(
      page: page,
      pageSize: pageSize,
      status: status != null ? _statusToString(status) : null,
      category: category != null ? _categoryToString(category) : null,
      agentId: agentId,
    );

    // Backend returns { data: [...], meta: { total, page, pageSize } }
    final json = response.data as Map<String, dynamic>;
    return PaginatedResponse.fromJson(
      json,
      (item) => Ticket.fromJson(item),
    );
  }

  @override
  Future<Ticket> getTicketById(String id) async {
    final response = await _apiService.getTicketById(id);

    // Backend returns { data: ticket }
    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<Ticket> updateTicketStatus({
    required String id,
    required TicketStatus status,
  }) async {
    final response = await _apiService.updateTicket(id, {
      'status': _statusToString(status),
    });

    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<Ticket> escalateTicket(String id) async {
    final response = await _apiService.escalateTicket(id);

    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<Ticket> reassignTicket({
    required String id,
    required String agentId,
  }) async {
    final response = await _apiService.updateTicket(id, {
      'agentId': agentId,
    });

    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<Ticket> confirmResolution(String id) async {
    final response = await _apiService.confirmResolution(id);

    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<Ticket> rejectResolution(String id) async {
    final response = await _apiService.rejectResolution(id);

    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  @override
  Future<Ticket> requestHumanHelp(String id) async {
    final response = await _apiService.requestHumanHelp(id);

    final data = response.data as Map<String, dynamic>;
    return Ticket.fromJson(data['data'] as Map<String, dynamic>);
  }

  // ── Enum to String helpers ──────────────────────────────────────────

  String _categoryToString(TicketCategory category) {
    switch (category) {
      case TicketCategory.it:
        return 'IT';
      case TicketCategory.hr:
        return 'HR';
      case TicketCategory.general:
        return 'General';
    }
  }

  String _subtypeToString(TicketSubtype subType) {
    switch (subType) {
      case TicketSubtype.information:
        return 'information';
      case TicketSubtype.action:
        return 'action';
      case TicketSubtype.conversation:
        return 'conversation';
      case TicketSubtype.escalation:
        return 'escalation';
    }
  }

  String _priorityToString(TicketPriority priority) {
    switch (priority) {
      case TicketPriority.low:
        return 'low';
      case TicketPriority.medium:
        return 'medium';
      case TicketPriority.high:
        return 'high';
    }
  }

  String _statusToString(TicketStatus status) {
    switch (status) {
      case TicketStatus.open:
        return 'open';
      case TicketStatus.inProgress:
        return 'in_progress';
      case TicketStatus.escalated:
        return 'escalated';
      case TicketStatus.resolved:
        return 'resolved';
      case TicketStatus.closed:
        return 'closed';
    }
  }
}
