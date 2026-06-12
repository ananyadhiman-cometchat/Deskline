import 'package:freezed_annotation/freezed_annotation.dart';

import '../enums/enums.dart';

part 'ticket.freezed.dart';
part 'ticket.g.dart';

@freezed
abstract class Ticket with _$Ticket {
  const factory Ticket({
    required String id,
    required String title,
    required String description,
    required TicketCategory category,
    required TicketSubtype subType,
    required TicketPriority priority,
    required TicketStatus status,
    required String employeeId,
    String? agentId,
    DateTime? lastActivityAt,
    DateTime? resolvedAt,
    DateTime? closedAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Ticket;

  factory Ticket.fromJson(Map<String, dynamic> json) => _$TicketFromJson(json);
}
