import 'package:freezed_annotation/freezed_annotation.dart';

part 'ticket_comment.freezed.dart';
part 'ticket_comment.g.dart';

@freezed
abstract class TicketComment with _$TicketComment {
  const factory TicketComment({
    required String id,
    required String ticketId,
    required String userId,
    required String body,
    required bool isAi,
    required DateTime createdAt,
    required DateTime updatedAt,
    CommentUser? user,
  }) = _TicketComment;

  factory TicketComment.fromJson(Map<String, dynamic> json) =>
      _$TicketCommentFromJson(json);
}

@freezed
abstract class CommentUser with _$CommentUser {
  const factory CommentUser({
    required String id,
    required String name,
    required String email,
    required String role,
  }) = _CommentUser;

  factory CommentUser.fromJson(Map<String, dynamic> json) =>
      _$CommentUserFromJson(json);
}
