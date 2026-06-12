// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ticket.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TicketImpl _$$TicketImplFromJson(Map<String, dynamic> json) => _$TicketImpl(
  id: json['id'] as String,
  title: json['title'] as String,
  description: json['description'] as String,
  category: $enumDecode(_$TicketCategoryEnumMap, json['category']),
  subType: $enumDecode(_$TicketSubtypeEnumMap, json['subType']),
  priority: $enumDecode(_$TicketPriorityEnumMap, json['priority']),
  status: $enumDecode(_$TicketStatusEnumMap, json['status']),
  employeeId: json['employeeId'] as String,
  agentId: json['agentId'] as String?,
  lastActivityAt: json['lastActivityAt'] == null
      ? null
      : DateTime.parse(json['lastActivityAt'] as String),
  resolvedAt: json['resolvedAt'] == null
      ? null
      : DateTime.parse(json['resolvedAt'] as String),
  closedAt: json['closedAt'] == null
      ? null
      : DateTime.parse(json['closedAt'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$$TicketImplToJson(_$TicketImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'category': _$TicketCategoryEnumMap[instance.category]!,
      'subType': _$TicketSubtypeEnumMap[instance.subType]!,
      'priority': _$TicketPriorityEnumMap[instance.priority]!,
      'status': _$TicketStatusEnumMap[instance.status]!,
      'employeeId': instance.employeeId,
      'agentId': instance.agentId,
      'lastActivityAt': instance.lastActivityAt?.toIso8601String(),
      'resolvedAt': instance.resolvedAt?.toIso8601String(),
      'closedAt': instance.closedAt?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$TicketCategoryEnumMap = {
  TicketCategory.it: 'IT',
  TicketCategory.hr: 'HR',
  TicketCategory.general: 'General',
};

const _$TicketSubtypeEnumMap = {
  TicketSubtype.information: 'information',
  TicketSubtype.action: 'action',
  TicketSubtype.conversation: 'conversation',
  TicketSubtype.escalation: 'escalation',
};

const _$TicketPriorityEnumMap = {
  TicketPriority.low: 'low',
  TicketPriority.medium: 'medium',
  TicketPriority.high: 'high',
};

const _$TicketStatusEnumMap = {
  TicketStatus.open: 'open',
  TicketStatus.inProgress: 'in_progress',
  TicketStatus.escalated: 'escalated',
  TicketStatus.resolved: 'resolved',
  TicketStatus.closed: 'closed',
};
