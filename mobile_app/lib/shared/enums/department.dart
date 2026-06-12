import 'package:json_annotation/json_annotation.dart';

enum Department {
  @JsonValue('IT')
  it,
  @JsonValue('HR')
  hr,
  @JsonValue('General')
  general,
}
