import 'package:json_annotation/json_annotation.dart';

enum UserRole {
  @JsonValue('employee')
  employee,
  @JsonValue('agent')
  agent,
  @JsonValue('supervisor')
  supervisor,
  @JsonValue('admin')
  admin,
}
