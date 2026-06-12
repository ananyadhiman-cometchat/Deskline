import 'package:json_annotation/json_annotation.dart';

enum NotificationType {
  @JsonValue('ticket_update')
  ticketUpdate,
  @JsonValue('assignment')
  assignment,
  @JsonValue('escalation')
  escalation,
  @JsonValue('announcement')
  announcement,
  @JsonValue('cometchat')
  cometchat,
}
