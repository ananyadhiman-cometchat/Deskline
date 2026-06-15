// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ticket_comment.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

TicketComment _$TicketCommentFromJson(Map<String, dynamic> json) {
  return _TicketComment.fromJson(json);
}

/// @nodoc
mixin _$TicketComment {
  String get id => throw _privateConstructorUsedError;
  String get ticketId => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get body => throw _privateConstructorUsedError;
  bool get isAi => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;
  CommentUser? get user => throw _privateConstructorUsedError;

  /// Serializes this TicketComment to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TicketComment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TicketCommentCopyWith<TicketComment> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TicketCommentCopyWith<$Res> {
  factory $TicketCommentCopyWith(
    TicketComment value,
    $Res Function(TicketComment) then,
  ) = _$TicketCommentCopyWithImpl<$Res, TicketComment>;
  @useResult
  $Res call({
    String id,
    String ticketId,
    String userId,
    String body,
    bool isAi,
    DateTime createdAt,
    DateTime updatedAt,
    CommentUser? user,
  });

  $CommentUserCopyWith<$Res>? get user;
}

/// @nodoc
class _$TicketCommentCopyWithImpl<$Res, $Val extends TicketComment>
    implements $TicketCommentCopyWith<$Res> {
  _$TicketCommentCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TicketComment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? ticketId = null,
    Object? userId = null,
    Object? body = null,
    Object? isAi = null,
    Object? createdAt = null,
    Object? updatedAt = null,
    Object? user = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            ticketId: null == ticketId
                ? _value.ticketId
                : ticketId // ignore: cast_nullable_to_non_nullable
                      as String,
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            body: null == body
                ? _value.body
                : body // ignore: cast_nullable_to_non_nullable
                      as String,
            isAi: null == isAi
                ? _value.isAi
                : isAi // ignore: cast_nullable_to_non_nullable
                      as bool,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            updatedAt: null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            user: freezed == user
                ? _value.user
                : user // ignore: cast_nullable_to_non_nullable
                      as CommentUser?,
          )
          as $Val,
    );
  }

  /// Create a copy of TicketComment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $CommentUserCopyWith<$Res>? get user {
    if (_value.user == null) {
      return null;
    }

    return $CommentUserCopyWith<$Res>(_value.user!, (value) {
      return _then(_value.copyWith(user: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$TicketCommentImplCopyWith<$Res>
    implements $TicketCommentCopyWith<$Res> {
  factory _$$TicketCommentImplCopyWith(
    _$TicketCommentImpl value,
    $Res Function(_$TicketCommentImpl) then,
  ) = __$$TicketCommentImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String ticketId,
    String userId,
    String body,
    bool isAi,
    DateTime createdAt,
    DateTime updatedAt,
    CommentUser? user,
  });

  @override
  $CommentUserCopyWith<$Res>? get user;
}

/// @nodoc
class __$$TicketCommentImplCopyWithImpl<$Res>
    extends _$TicketCommentCopyWithImpl<$Res, _$TicketCommentImpl>
    implements _$$TicketCommentImplCopyWith<$Res> {
  __$$TicketCommentImplCopyWithImpl(
    _$TicketCommentImpl _value,
    $Res Function(_$TicketCommentImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TicketComment
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? ticketId = null,
    Object? userId = null,
    Object? body = null,
    Object? isAi = null,
    Object? createdAt = null,
    Object? updatedAt = null,
    Object? user = freezed,
  }) {
    return _then(
      _$TicketCommentImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        ticketId: null == ticketId
            ? _value.ticketId
            : ticketId // ignore: cast_nullable_to_non_nullable
                  as String,
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        body: null == body
            ? _value.body
            : body // ignore: cast_nullable_to_non_nullable
                  as String,
        isAi: null == isAi
            ? _value.isAi
            : isAi // ignore: cast_nullable_to_non_nullable
                  as bool,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        updatedAt: null == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        user: freezed == user
            ? _value.user
            : user // ignore: cast_nullable_to_non_nullable
                  as CommentUser?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TicketCommentImpl implements _TicketComment {
  const _$TicketCommentImpl({
    required this.id,
    required this.ticketId,
    required this.userId,
    required this.body,
    required this.isAi,
    required this.createdAt,
    required this.updatedAt,
    this.user,
  });

  factory _$TicketCommentImpl.fromJson(Map<String, dynamic> json) =>
      _$$TicketCommentImplFromJson(json);

  @override
  final String id;
  @override
  final String ticketId;
  @override
  final String userId;
  @override
  final String body;
  @override
  final bool isAi;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;
  @override
  final CommentUser? user;

  @override
  String toString() {
    return 'TicketComment(id: $id, ticketId: $ticketId, userId: $userId, body: $body, isAi: $isAi, createdAt: $createdAt, updatedAt: $updatedAt, user: $user)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TicketCommentImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.ticketId, ticketId) ||
                other.ticketId == ticketId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.body, body) || other.body == body) &&
            (identical(other.isAi, isAi) || other.isAi == isAi) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.user, user) || other.user == user));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    ticketId,
    userId,
    body,
    isAi,
    createdAt,
    updatedAt,
    user,
  );

  /// Create a copy of TicketComment
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TicketCommentImplCopyWith<_$TicketCommentImpl> get copyWith =>
      __$$TicketCommentImplCopyWithImpl<_$TicketCommentImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TicketCommentImplToJson(this);
  }
}

abstract class _TicketComment implements TicketComment {
  const factory _TicketComment({
    required final String id,
    required final String ticketId,
    required final String userId,
    required final String body,
    required final bool isAi,
    required final DateTime createdAt,
    required final DateTime updatedAt,
    final CommentUser? user,
  }) = _$TicketCommentImpl;

  factory _TicketComment.fromJson(Map<String, dynamic> json) =
      _$TicketCommentImpl.fromJson;

  @override
  String get id;
  @override
  String get ticketId;
  @override
  String get userId;
  @override
  String get body;
  @override
  bool get isAi;
  @override
  DateTime get createdAt;
  @override
  DateTime get updatedAt;
  @override
  CommentUser? get user;

  /// Create a copy of TicketComment
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TicketCommentImplCopyWith<_$TicketCommentImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CommentUser _$CommentUserFromJson(Map<String, dynamic> json) {
  return _CommentUser.fromJson(json);
}

/// @nodoc
mixin _$CommentUser {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get role => throw _privateConstructorUsedError;

  /// Serializes this CommentUser to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CommentUser
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CommentUserCopyWith<CommentUser> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CommentUserCopyWith<$Res> {
  factory $CommentUserCopyWith(
    CommentUser value,
    $Res Function(CommentUser) then,
  ) = _$CommentUserCopyWithImpl<$Res, CommentUser>;
  @useResult
  $Res call({String id, String name, String email, String role});
}

/// @nodoc
class _$CommentUserCopyWithImpl<$Res, $Val extends CommentUser>
    implements $CommentUserCopyWith<$Res> {
  _$CommentUserCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CommentUser
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? email = null,
    Object? role = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            email: null == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as String,
            role: null == role
                ? _value.role
                : role // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CommentUserImplCopyWith<$Res>
    implements $CommentUserCopyWith<$Res> {
  factory _$$CommentUserImplCopyWith(
    _$CommentUserImpl value,
    $Res Function(_$CommentUserImpl) then,
  ) = __$$CommentUserImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, String name, String email, String role});
}

/// @nodoc
class __$$CommentUserImplCopyWithImpl<$Res>
    extends _$CommentUserCopyWithImpl<$Res, _$CommentUserImpl>
    implements _$$CommentUserImplCopyWith<$Res> {
  __$$CommentUserImplCopyWithImpl(
    _$CommentUserImpl _value,
    $Res Function(_$CommentUserImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CommentUser
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? email = null,
    Object? role = null,
  }) {
    return _then(
      _$CommentUserImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        email: null == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as String,
        role: null == role
            ? _value.role
            : role // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CommentUserImpl implements _CommentUser {
  const _$CommentUserImpl({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory _$CommentUserImpl.fromJson(Map<String, dynamic> json) =>
      _$$CommentUserImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String email;
  @override
  final String role;

  @override
  String toString() {
    return 'CommentUser(id: $id, name: $name, email: $email, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CommentUserImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.role, role) || other.role == role));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, email, role);

  /// Create a copy of CommentUser
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CommentUserImplCopyWith<_$CommentUserImpl> get copyWith =>
      __$$CommentUserImplCopyWithImpl<_$CommentUserImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CommentUserImplToJson(this);
  }
}

abstract class _CommentUser implements CommentUser {
  const factory _CommentUser({
    required final String id,
    required final String name,
    required final String email,
    required final String role,
  }) = _$CommentUserImpl;

  factory _CommentUser.fromJson(Map<String, dynamic> json) =
      _$CommentUserImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get email;
  @override
  String get role;

  /// Create a copy of CommentUser
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CommentUserImplCopyWith<_$CommentUserImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
