import 'package:freezed_annotation/freezed_annotation.dart';

import '../enums/enums.dart';

part 'agent_workload.freezed.dart';
part 'agent_workload.g.dart';

@freezed
abstract class AgentWorkload with _$AgentWorkload {
  const factory AgentWorkload({
    required String userId,
    required String name,
    required Department department,
    required int openCount,
    required int inProgressCount,
    required int resolvedCount,
  }) = _AgentWorkload;

  factory AgentWorkload.fromJson(Map<String, dynamic> json) =>
      _$AgentWorkloadFromJson(json);
}
