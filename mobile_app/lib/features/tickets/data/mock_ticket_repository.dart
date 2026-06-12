import '../../../shared/enums/enums.dart';
import '../../../shared/models/models.dart';
import 'ticket_repository.dart';

class MockTicketRepository implements TicketRepository {
  final List<Ticket> _tickets = List.from(_mockTickets);

  static final _mockTickets = [
    Ticket(
      id: 'tkt-001',
      title: 'Laptop not booting',
      description: 'My work laptop shows a black screen on startup.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.high,
      status: TicketStatus.open,
      employeeId: 'usr-001',
      createdAt: DateTime(2026, 6, 1),
      updatedAt: DateTime(2026, 6, 1),
    ),
    Ticket(
      id: 'tkt-002',
      title: 'VPN access request',
      description: 'Need VPN access for remote work.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.medium,
      status: TicketStatus.inProgress,
      employeeId: 'usr-001',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 3),
      createdAt: DateTime(2026, 6, 2),
      updatedAt: DateTime(2026, 6, 3),
    ),
    Ticket(
      id: 'tkt-003',
      title: 'Leave policy clarification',
      description: 'How many casual leaves can be carried forward?',
      category: TicketCategory.hr,
      subType: TicketSubtype.information,
      priority: TicketPriority.low,
      status: TicketStatus.resolved,
      employeeId: 'usr-005',
      agentId: 'usr-006',
      lastActivityAt: DateTime(2026, 5, 28),
      createdAt: DateTime(2026, 5, 25),
      updatedAt: DateTime(2026, 5, 28),
    ),
    Ticket(
      id: 'tkt-004',
      title: 'Printer not working on 3rd floor',
      description: 'The shared printer near the break room is offline.',
      category: TicketCategory.general,
      subType: TicketSubtype.action,
      priority: TicketPriority.medium,
      status: TicketStatus.open,
      employeeId: 'usr-007',
      createdAt: DateTime(2026, 6, 5),
      updatedAt: DateTime(2026, 6, 5),
    ),
    Ticket(
      id: 'tkt-005',
      title: 'Software license renewal',
      description: 'Adobe Creative Suite license expiring next week.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.high,
      status: TicketStatus.escalated,
      employeeId: 'usr-008',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 7),
      createdAt: DateTime(2026, 6, 4),
      updatedAt: DateTime(2026, 6, 7),
    ),
    Ticket(
      id: 'tkt-006',
      title: 'New employee onboarding checklist',
      description: 'Need the HR onboarding checklist for new joiners.',
      category: TicketCategory.hr,
      subType: TicketSubtype.information,
      priority: TicketPriority.low,
      status: TicketStatus.closed,
      employeeId: 'usr-009',
      agentId: 'usr-006',
      lastActivityAt: DateTime(2026, 5, 20),
      createdAt: DateTime(2026, 5, 18),
      updatedAt: DateTime(2026, 5, 20),
    ),
    Ticket(
      id: 'tkt-007',
      title: 'Email not syncing on phone',
      description: 'Outlook mobile app not receiving new emails.',
      category: TicketCategory.it,
      subType: TicketSubtype.conversation,
      priority: TicketPriority.medium,
      status: TicketStatus.inProgress,
      employeeId: 'usr-010',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 8),
      createdAt: DateTime(2026, 6, 6),
      updatedAt: DateTime(2026, 6, 8),
    ),
    Ticket(
      id: 'tkt-008',
      title: 'Building access card replacement',
      description: 'Lost my access card, need a replacement.',
      category: TicketCategory.general,
      subType: TicketSubtype.action,
      priority: TicketPriority.medium,
      status: TicketStatus.open,
      employeeId: 'usr-011',
      createdAt: DateTime(2026, 6, 9),
      updatedAt: DateTime(2026, 6, 9),
    ),
    Ticket(
      id: 'tkt-009',
      title: 'Payslip discrepancy',
      description: 'Last month payslip shows incorrect overtime hours.',
      category: TicketCategory.hr,
      subType: TicketSubtype.escalation,
      priority: TicketPriority.high,
      status: TicketStatus.escalated,
      employeeId: 'usr-012',
      agentId: 'usr-006',
      lastActivityAt: DateTime(2026, 6, 9),
      createdAt: DateTime(2026, 6, 7),
      updatedAt: DateTime(2026, 6, 9),
    ),
    Ticket(
      id: 'tkt-010',
      title: 'Monitor flickering',
      description: 'External monitor keeps flickering when connected.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.low,
      status: TicketStatus.open,
      employeeId: 'usr-013',
      createdAt: DateTime(2026, 6, 10),
      updatedAt: DateTime(2026, 6, 10),
    ),
    Ticket(
      id: 'tkt-011',
      title: 'Conference room booking system down',
      description: 'Cannot book rooms via the internal portal.',
      category: TicketCategory.general,
      subType: TicketSubtype.action,
      priority: TicketPriority.high,
      status: TicketStatus.inProgress,
      employeeId: 'usr-014',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 10),
      createdAt: DateTime(2026, 6, 9),
      updatedAt: DateTime(2026, 6, 10),
    ),
    Ticket(
      id: 'tkt-012',
      title: 'Request for ergonomic chair',
      description: 'Back pain from current chair, need an upgrade.',
      category: TicketCategory.general,
      subType: TicketSubtype.action,
      priority: TicketPriority.low,
      status: TicketStatus.open,
      employeeId: 'usr-015',
      createdAt: DateTime(2026, 6, 10),
      updatedAt: DateTime(2026, 6, 10),
    ),
    Ticket(
      id: 'tkt-013',
      title: 'Two-factor authentication setup',
      description: 'Need help setting up 2FA on company accounts.',
      category: TicketCategory.it,
      subType: TicketSubtype.conversation,
      priority: TicketPriority.medium,
      status: TicketStatus.resolved,
      employeeId: 'usr-001',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 5),
      createdAt: DateTime(2026, 6, 3),
      updatedAt: DateTime(2026, 6, 5),
    ),
    Ticket(
      id: 'tkt-014',
      title: 'Remote work policy update',
      description: 'Is the hybrid policy changing for Q3?',
      category: TicketCategory.hr,
      subType: TicketSubtype.information,
      priority: TicketPriority.low,
      status: TicketStatus.closed,
      employeeId: 'usr-007',
      agentId: 'usr-006',
      lastActivityAt: DateTime(2026, 5, 30),
      createdAt: DateTime(2026, 5, 28),
      updatedAt: DateTime(2026, 5, 30),
    ),
    Ticket(
      id: 'tkt-015',
      title: 'Database access for analytics team',
      description: 'Need read-only access to reporting database.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.high,
      status: TicketStatus.inProgress,
      employeeId: 'usr-008',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 11),
      createdAt: DateTime(2026, 6, 10),
      updatedAt: DateTime(2026, 6, 11),
    ),
    Ticket(
      id: 'tkt-016',
      title: 'Broken window in meeting room B',
      description: 'The window latch is broken and cannot be closed.',
      category: TicketCategory.general,
      subType: TicketSubtype.action,
      priority: TicketPriority.medium,
      status: TicketStatus.open,
      employeeId: 'usr-009',
      createdAt: DateTime(2026, 6, 11),
      updatedAt: DateTime(2026, 6, 11),
    ),
    Ticket(
      id: 'tkt-017',
      title: 'Salary certificate request',
      description: 'Need a salary certificate for visa application.',
      category: TicketCategory.hr,
      subType: TicketSubtype.action,
      priority: TicketPriority.medium,
      status: TicketStatus.open,
      employeeId: 'usr-010',
      createdAt: DateTime(2026, 6, 11),
      updatedAt: DateTime(2026, 6, 11),
    ),
    Ticket(
      id: 'tkt-018',
      title: 'Slack workspace invite',
      description: 'Not added to the #engineering channel yet.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.low,
      status: TicketStatus.resolved,
      employeeId: 'usr-011',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 8),
      createdAt: DateTime(2026, 6, 7),
      updatedAt: DateTime(2026, 6, 8),
    ),
    Ticket(
      id: 'tkt-019',
      title: 'Performance review timeline',
      description: 'When are mid-year reviews scheduled?',
      category: TicketCategory.hr,
      subType: TicketSubtype.information,
      priority: TicketPriority.low,
      status: TicketStatus.resolved,
      employeeId: 'usr-012',
      agentId: 'usr-006',
      lastActivityAt: DateTime(2026, 6, 6),
      createdAt: DateTime(2026, 6, 4),
      updatedAt: DateTime(2026, 6, 6),
    ),
    Ticket(
      id: 'tkt-020',
      title: 'Network outage on 5th floor',
      description: 'WiFi and ethernet both down since morning.',
      category: TicketCategory.it,
      subType: TicketSubtype.escalation,
      priority: TicketPriority.high,
      status: TicketStatus.escalated,
      employeeId: 'usr-013',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 11),
      createdAt: DateTime(2026, 6, 11),
      updatedAt: DateTime(2026, 6, 11),
    ),
    Ticket(
      id: 'tkt-021',
      title: 'Guest WiFi password reset',
      description: 'Visitor WiFi not accepting current credentials.',
      category: TicketCategory.it,
      subType: TicketSubtype.action,
      priority: TicketPriority.low,
      status: TicketStatus.closed,
      employeeId: 'usr-014',
      agentId: 'usr-002',
      lastActivityAt: DateTime(2026, 6, 2),
      createdAt: DateTime(2026, 6, 1),
      updatedAt: DateTime(2026, 6, 2),
    ),
  ];

  @override
  Future<Ticket> createTicket({
    required String title,
    required String description,
    required TicketCategory category,
    required TicketSubtype subType,
    required TicketPriority priority,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final ticket = Ticket(
      id: 'tkt-${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      description: description,
      category: category,
      subType: subType,
      priority: priority,
      status: TicketStatus.open,
      employeeId: 'usr-001',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    _tickets.add(ticket);
    return ticket;
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
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    var filtered = List<Ticket>.from(_tickets);

    if (status != null) {
      filtered = filtered.where((t) => t.status == status).toList();
    }
    if (category != null) {
      filtered = filtered.where((t) => t.category == category).toList();
    }
    if (priority != null) {
      filtered = filtered.where((t) => t.priority == priority).toList();
    }
    if (assignedToMe != null) {
      filtered = filtered.where((t) => t.agentId == assignedToMe).toList();
    }
    if (search != null && search.isNotEmpty) {
      final query = search.toLowerCase();
      filtered = filtered
          .where(
            (t) =>
                t.title.toLowerCase().contains(query) ||
                t.description.toLowerCase().contains(query),
          )
          .toList();
    }

    final total = filtered.length;
    final start = (page - 1) * pageSize;
    final end = start + pageSize > total ? total : start + pageSize;
    final paged = start < total ? filtered.sublist(start, end) : <Ticket>[];

    return PaginatedResponse(
      data: paged,
      meta: PaginationMeta(total: total, page: page, pageSize: pageSize),
    );
  }

  @override
  Future<Ticket> getTicketById(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));

    return _tickets.firstWhere(
      (t) => t.id == id,
      orElse: () => throw Exception('Ticket not found'),
    );
  }

  @override
  Future<Ticket> updateTicketStatus({
    required String id,
    required TicketStatus status,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final index = _tickets.indexWhere((t) => t.id == id);
    if (index == -1) throw Exception('Ticket not found');

    final updated = _tickets[index].copyWith(
      status: status,
      updatedAt: DateTime.now(),
      lastActivityAt: DateTime.now(),
    );
    _tickets[index] = updated;
    return updated;
  }

  @override
  Future<Ticket> escalateTicket(String id) async {
    return updateTicketStatus(id: id, status: TicketStatus.escalated);
  }

  @override
  Future<Ticket> reassignTicket({
    required String id,
    required String agentId,
  }) async {
    await Future.delayed(const Duration(milliseconds: 500));

    final index = _tickets.indexWhere((t) => t.id == id);
    if (index == -1) throw Exception('Ticket not found');

    final updated = _tickets[index].copyWith(
      agentId: agentId,
      updatedAt: DateTime.now(),
      lastActivityAt: DateTime.now(),
    );
    _tickets[index] = updated;
    return updated;
  }
}
