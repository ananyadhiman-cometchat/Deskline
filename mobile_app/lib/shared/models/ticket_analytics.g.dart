// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ticket_analytics.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TicketAnalyticsImpl _$$TicketAnalyticsImplFromJson(
  Map<String, dynamic> json,
) => _$TicketAnalyticsImpl(
  totalTickets: (json['totalTickets'] as num).toInt(),
  activeTickets: (json['activeTickets'] as num).toInt(),
  resolvedTickets: (json['resolvedTickets'] as num).toInt(),
  escalatedTickets: (json['escalatedTickets'] as num).toInt(),
  totalUsers: (json['totalUsers'] as num).toInt(),
  byCategory:
      (json['byCategory'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, (e as num).toInt()),
      ) ??
      const {},
  byStatus:
      (json['byStatus'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, (e as num).toInt()),
      ) ??
      const {},
  byDepartment:
      (json['byDepartment'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, (e as num).toInt()),
      ) ??
      const {},
);

Map<String, dynamic> _$$TicketAnalyticsImplToJson(
  _$TicketAnalyticsImpl instance,
) => <String, dynamic>{
  'totalTickets': instance.totalTickets,
  'activeTickets': instance.activeTickets,
  'resolvedTickets': instance.resolvedTickets,
  'escalatedTickets': instance.escalatedTickets,
  'totalUsers': instance.totalUsers,
  'byCategory': instance.byCategory,
  'byStatus': instance.byStatus,
  'byDepartment': instance.byDepartment,
};
