import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/networking/dio_provider.dart';
import '../../../shared/models/models.dart';
import '../data/ticket_api_service.dart';

/// Provider that fetches comments for a specific ticket.
final ticketCommentsProvider =
    FutureProvider.family<List<TicketComment>, String>((ref, ticketId) async {
  final dioClient = ref.watch(dioClientProvider);
  final apiService = TicketApiService(dioClient);
  final response = await apiService.getComments(ticketId);

  final json = response.data as Map<String, dynamic>;
  final dataList = json['data'] as List<dynamic>;
  return dataList
      .map((e) => TicketComment.fromJson(e as Map<String, dynamic>))
      .toList();
});
