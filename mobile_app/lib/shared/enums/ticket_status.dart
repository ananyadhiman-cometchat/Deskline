import 'package:json_annotation/json_annotation.dart';

enum TicketStatus {
  @JsonValue('open')
  open,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('escalated')
  escalated,
  @JsonValue('resolved')
  resolved,
  @JsonValue('closed')
  closed,
}
