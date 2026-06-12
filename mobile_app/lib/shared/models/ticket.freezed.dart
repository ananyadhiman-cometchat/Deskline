// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ticket.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Ticket _$TicketFromJson(Map<String, dynamic> json) {
  return _Ticket.fromJson(json);
}

/// @nodoc
mixin _$Ticket {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  TicketCategory get category => throw _privateConstructorUsedError;
  TicketSubtype get subType => throw _privateConstructorUsedError;
  TicketPriority get priority => throw _privateConstructorUsedError;
  TicketStatus get status => throw _privateConstructorUsedError;
  String get employeeId => throw _privateConstructorUsedError;
  String? get agentId => throw _privateConstructorUsedError;
  DateTime? get lastActivityAt => throw _privateConstructorUsedError;
  DateTime? get resolvedAt => throw _privateConstructorUsedError;
  DateTime? get closedAt => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this Ticket to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Ticket
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TicketCopyWith<Ticket> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TicketCopyWith<$Res> {
  factory $TicketCopyWith(Ticket value, $Res Function(Ticket) then) =
      _$TicketCopyWithImpl<$Res, Ticket>;
  @useResult
  $Res call({
    String id,
    String title,
    String description,
    TicketCategory category,
    TicketSubtype subType,
    TicketPriority priority,
    TicketStatus status,
    String employeeId,
    String? agentId,
    DateTime? lastActivityAt,
    DateTime? resolvedAt,
    DateTime? closedAt,
    DateTime createdAt,
    DateTime updatedAt,
  });
}

/// @nodoc
class _$TicketCopyWithImpl<$Res, $Val extends Ticket>
    implements $TicketCopyWith<$Res> {
  _$TicketCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Ticket
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = null,
    Object? category = null,
    Object? subType = null,
    Object? priority = null,
    Object? status = null,
    Object? employeeId = null,
    Object? agentId = freezed,
    Object? lastActivityAt = freezed,
    Object? resolvedAt = freezed,
    Object? closedAt = freezed,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            description: null == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String,
            category: null == category
                ? _value.category
                : category // ignore: cast_nullable_to_non_nullable
                      as TicketCategory,
            subType: null == subType
                ? _value.subType
                : subType // ignore: cast_nullable_to_non_nullable
                      as TicketSubtype,
            priority: null == priority
                ? _value.priority
                : priority // ignore: cast_nullable_to_non_nullable
                      as TicketPriority,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as TicketStatus,
            employeeId: null == employeeId
                ? _value.employeeId
                : employeeId // ignore: cast_nullable_to_non_nullable
                      as String,
            agentId: freezed == agentId
                ? _value.agentId
                : agentId // ignore: cast_nullable_to_non_nullable
                      as String?,
            lastActivityAt: freezed == lastActivityAt
                ? _value.lastActivityAt
                : lastActivityAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            resolvedAt: freezed == resolvedAt
                ? _value.resolvedAt
                : resolvedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            closedAt: freezed == closedAt
                ? _value.closedAt
                : closedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            createdAt: null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
            updatedAt: null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TicketImplCopyWith<$Res> implements $TicketCopyWith<$Res> {
  factory _$$TicketImplCopyWith(
    _$TicketImpl value,
    $Res Function(_$TicketImpl) then,
  ) = __$$TicketImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String title,
    String description,
    TicketCategory category,
    TicketSubtype subType,
    TicketPriority priority,
    TicketStatus status,
    String employeeId,
    String? agentId,
    DateTime? lastActivityAt,
    DateTime? resolvedAt,
    DateTime? closedAt,
    DateTime createdAt,
    DateTime updatedAt,
  });
}

/// @nodoc
class __$$TicketImplCopyWithImpl<$Res>
    extends _$TicketCopyWithImpl<$Res, _$TicketImpl>
    implements _$$TicketImplCopyWith<$Res> {
  __$$TicketImplCopyWithImpl(
    _$TicketImpl _value,
    $Res Function(_$TicketImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Ticket
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? description = null,
    Object? category = null,
    Object? subType = null,
    Object? priority = null,
    Object? status = null,
    Object? employeeId = null,
    Object? agentId = freezed,
    Object? lastActivityAt = freezed,
    Object? resolvedAt = freezed,
    Object? closedAt = freezed,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _$TicketImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        description: null == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String,
        category: null == category
            ? _value.category
            : category // ignore: cast_nullable_to_non_nullable
                  as TicketCategory,
        subType: null == subType
            ? _value.subType
            : subType // ignore: cast_nullable_to_non_nullable
                  as TicketSubtype,
        priority: null == priority
            ? _value.priority
            : priority // ignore: cast_nullable_to_non_nullable
                  as TicketPriority,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as TicketStatus,
        employeeId: null == employeeId
            ? _value.employeeId
            : employeeId // ignore: cast_nullable_to_non_nullable
                  as String,
        agentId: freezed == agentId
            ? _value.agentId
            : agentId // ignore: cast_nullable_to_non_nullable
                  as String?,
        lastActivityAt: freezed == lastActivityAt
            ? _value.lastActivityAt
            : lastActivityAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        resolvedAt: freezed == resolvedAt
            ? _value.resolvedAt
            : resolvedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        closedAt: freezed == closedAt
            ? _value.closedAt
            : closedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        createdAt: null == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
        updatedAt: null == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TicketImpl implements _Ticket {
  const _$TicketImpl({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.subType,
    required this.priority,
    required this.status,
    required this.employeeId,
    this.agentId,
    this.lastActivityAt,
    this.resolvedAt,
    this.closedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory _$TicketImpl.fromJson(Map<String, dynamic> json) =>
      _$$TicketImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String description;
  @override
  final TicketCategory category;
  @override
  final TicketSubtype subType;
  @override
  final TicketPriority priority;
  @override
  final TicketStatus status;
  @override
  final String employeeId;
  @override
  final String? agentId;
  @override
  final DateTime? lastActivityAt;
  @override
  final DateTime? resolvedAt;
  @override
  final DateTime? closedAt;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  @override
  String toString() {
    return 'Ticket(id: $id, title: $title, description: $description, category: $category, subType: $subType, priority: $priority, status: $status, employeeId: $employeeId, agentId: $agentId, lastActivityAt: $lastActivityAt, resolvedAt: $resolvedAt, closedAt: $closedAt, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TicketImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.subType, subType) || other.subType == subType) &&
            (identical(other.priority, priority) ||
                other.priority == priority) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.employeeId, employeeId) ||
                other.employeeId == employeeId) &&
            (identical(other.agentId, agentId) || other.agentId == agentId) &&
            (identical(other.lastActivityAt, lastActivityAt) ||
                other.lastActivityAt == lastActivityAt) &&
            (identical(other.resolvedAt, resolvedAt) ||
                other.resolvedAt == resolvedAt) &&
            (identical(other.closedAt, closedAt) ||
                other.closedAt == closedAt) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    title,
    description,
    category,
    subType,
    priority,
    status,
    employeeId,
    agentId,
    lastActivityAt,
    resolvedAt,
    closedAt,
    createdAt,
    updatedAt,
  );

  /// Create a copy of Ticket
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TicketImplCopyWith<_$TicketImpl> get copyWith =>
      __$$TicketImplCopyWithImpl<_$TicketImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TicketImplToJson(this);
  }
}

abstract class _Ticket implements Ticket {
  const factory _Ticket({
    required final String id,
    required final String title,
    required final String description,
    required final TicketCategory category,
    required final TicketSubtype subType,
    required final TicketPriority priority,
    required final TicketStatus status,
    required final String employeeId,
    final String? agentId,
    final DateTime? lastActivityAt,
    final DateTime? resolvedAt,
    final DateTime? closedAt,
    required final DateTime createdAt,
    required final DateTime updatedAt,
  }) = _$TicketImpl;

  factory _Ticket.fromJson(Map<String, dynamic> json) = _$TicketImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get description;
  @override
  TicketCategory get category;
  @override
  TicketSubtype get subType;
  @override
  TicketPriority get priority;
  @override
  TicketStatus get status;
  @override
  String get employeeId;
  @override
  String? get agentId;
  @override
  DateTime? get lastActivityAt;
  @override
  DateTime? get resolvedAt;
  @override
  DateTime? get closedAt;
  @override
  DateTime get createdAt;
  @override
  DateTime get updatedAt;

  /// Create a copy of Ticket
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TicketImplCopyWith<_$TicketImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
