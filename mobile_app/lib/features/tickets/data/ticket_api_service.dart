import 'package:dio/dio.dart';
import '../../../shared/services/api_client.dart';
import '../dto/create_ticket_request_dto.dart';
class TicketApiService {
 Future<Response> createTicket(CreateTicketRequestDto dto){
  return ApiClient.dio.post('',data:dto.toJson());
 }
}