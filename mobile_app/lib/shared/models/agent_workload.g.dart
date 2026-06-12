// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agent_workload.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AgentWorkloadImpl _$$AgentWorkloadImplFromJson(Map<String, dynamic> json) =>
    _$AgentWorkloadImpl(
      userId: json['userId'] as String,
      name: json['name'] as String,
      department: $enumDecode(_$DepartmentEnumMap, json['department']),
      openCount: (json['openCount'] as num).toInt(),
      inProgressCount: (json['inProgressCount'] as num).toInt(),
      resolvedCount: (json['resolvedCount'] as num).toInt(),
    );

Map<String, dynamic> _$$AgentWorkloadImplToJson(_$AgentWorkloadImpl instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'name': instance.name,
      'department': _$DepartmentEnumMap[instance.department]!,
      'openCount': instance.openCount,
      'inProgressCount': instance.inProgressCount,
      'resolvedCount': instance.resolvedCount,
    };

const _$DepartmentEnumMap = {
  Department.it: 'IT',
  Department.hr: 'HR',
  Department.general: 'General',
};
