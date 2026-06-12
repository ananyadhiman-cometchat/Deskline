import 'package:json_annotation/json_annotation.dart';

enum TicketSubtype {
  @JsonValue('information')
  information,
  @JsonValue('action')
  action,
  @JsonValue('conversation')
  conversation,
  @JsonValue('escalation')
  escalation,
}
