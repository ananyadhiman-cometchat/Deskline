import 'package:freezed_annotation/freezed_annotation.dart';

part 'ticket_analytics.freezed.dart';
part 'ticket_analytics.g.dart';

@freezed
abstract class TicketAnalytics with _$TicketAnalytics {
  const factory TicketAnalytics({
    required int totalTickets,
    required int activeTickets,
    required int resolvedTickets,
    required int escalatedTickets,
    required int totalUsers,
    @Default({}) Map<String, int> byCategory,
    @Default({}) Map<String, int> byStatus,
    @Default({}) Map<String, int> byDepartment,
  }) = _TicketAnalytics;

  factory TicketAnalytics.fromJson(Map<String, dynamic> json) =>
      _$TicketAnalyticsFromJson(json);
}
