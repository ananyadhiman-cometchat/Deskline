import 'package:json_annotation/json_annotation.dart';

enum TicketCategory {
  @JsonValue('IT')
  it,
  @JsonValue('HR')
  hr,
  @JsonValue('General')
  general,
}
