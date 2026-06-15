// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ticket_comment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TicketCommentImpl _$$TicketCommentImplFromJson(Map<String, dynamic> json) =>
    _$TicketCommentImpl(
      id: json['id'] as String,
      ticketId: json['ticketId'] as String,
      userId: json['userId'] as String,
      body: json['body'] as String,
      isAi: json['isAi'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      user: json['user'] == null
          ? null
          : CommentUser.fromJson(json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$TicketCommentImplToJson(_$TicketCommentImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'ticketId': instance.ticketId,
      'userId': instance.userId,
      'body': instance.body,
      'isAi': instance.isAi,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'user': instance.user,
    };

_$CommentUserImpl _$$CommentUserImplFromJson(Map<String, dynamic> json) =>
    _$CommentUserImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
    );

Map<String, dynamic> _$$CommentUserImplToJson(_$CommentUserImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'role': instance.role,
    };
