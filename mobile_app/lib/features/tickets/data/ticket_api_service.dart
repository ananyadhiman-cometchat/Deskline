import 'package:dio/dio.dart';

import '../../../core/networking/api_endpoints.dart';
import '../../../core/networking/dio_client.dart';
import '../dto/create_ticket_request_dto.dart';

class TicketApiService {
  final Dio _dio;

  TicketApiService(DioClient client) : _dio = client.dio;

  Future<Response> createTicket(CreateTicketRequestDto dto) {
    return _dio.post(ApiEndpoints.tickets, data: dto.toJson());
  }

  Future<Response> getTickets({
    int page = 1,
    int pageSize = 20,
    String? status,
    String? category,
    String? subType,
  }) {
    final queryParams = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (status != null) queryParams['status'] = status;
    if (category != null) queryParams['category'] = category;
    if (subType != null) queryParams['subType'] = subType;

    return _dio.get(ApiEndpoints.tickets, queryParameters: queryParams);
  }

  Future<Response> getTicketById(String id) {
    return _dio.get(ApiEndpoints.ticketById(id));
  }

  Future<Response> updateTicket(String id, Map<String, dynamic> data) {
    return _dio.patch(ApiEndpoints.ticketById(id), data: data);
  }

  Future<Response> escalateTicket(String id) {
    return _dio.post(ApiEndpoints.ticketEscalate(id));
  }

  Future<Response> confirmResolution(String id) {
    return _dio.post(ApiEndpoints.ticketConfirmResolution(id));
  }

  Future<Response> rejectResolution(String id) {
    return _dio.post(ApiEndpoints.ticketRejectResolution(id));
  }

  Future<Response> requestHumanHelp(String id) {
    return _dio.post(ApiEndpoints.ticketRequestHumanHelp(id));
  }

  Future<Response> getComments(String ticketId) {
    return _dio.get(ApiEndpoints.ticketComments(ticketId));
  }

  Future<Response> addComment(String ticketId, String body) {
    return _dio.post(
      ApiEndpoints.ticketComments(ticketId),
      data: {'body': body},
    );
  }
}
