// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'agent_workload.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

AgentWorkload _$AgentWorkloadFromJson(Map<String, dynamic> json) {
  return _AgentWorkload.fromJson(json);
}

/// @nodoc
mixin _$AgentWorkload {
  String get userId => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  Department get department => throw _privateConstructorUsedError;
  int get openCount => throw _privateConstructorUsedError;
  int get inProgressCount => throw _privateConstructorUsedError;
  int get resolvedCount => throw _privateConstructorUsedError;

  /// Serializes this AgentWorkload to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AgentWorkload
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AgentWorkloadCopyWith<AgentWorkload> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AgentWorkloadCopyWith<$Res> {
  factory $AgentWorkloadCopyWith(
    AgentWorkload value,
    $Res Function(AgentWorkload) then,
  ) = _$AgentWorkloadCopyWithImpl<$Res, AgentWorkload>;
  @useResult
  $Res call({
    String userId,
    String name,
    Department department,
    int openCount,
    int inProgressCount,
    int resolvedCount,
  });
}

/// @nodoc
class _$AgentWorkloadCopyWithImpl<$Res, $Val extends AgentWorkload>
    implements $AgentWorkloadCopyWith<$Res> {
  _$AgentWorkloadCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AgentWorkload
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? userId = null,
    Object? name = null,
    Object? department = null,
    Object? openCount = null,
    Object? inProgressCount = null,
    Object? resolvedCount = null,
  }) {
    return _then(
      _value.copyWith(
            userId: null == userId
                ? _value.userId
                : userId // ignore: cast_nullable_to_non_nullable
                      as String,
            name: null == name
                ? _value.name
                : name // ignore: cast_nullable_to_non_nullable
                      as String,
            department: null == department
                ? _value.department
                : department // ignore: cast_nullable_to_non_nullable
                      as Department,
            openCount: null == openCount
                ? _value.openCount
                : openCount // ignore: cast_nullable_to_non_nullable
                      as int,
            inProgressCount: null == inProgressCount
                ? _value.inProgressCount
                : inProgressCount // ignore: cast_nullable_to_non_nullable
                      as int,
            resolvedCount: null == resolvedCount
                ? _value.resolvedCount
                : resolvedCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$AgentWorkloadImplCopyWith<$Res>
    implements $AgentWorkloadCopyWith<$Res> {
  factory _$$AgentWorkloadImplCopyWith(
    _$AgentWorkloadImpl value,
    $Res Function(_$AgentWorkloadImpl) then,
  ) = __$$AgentWorkloadImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String userId,
    String name,
    Department department,
    int openCount,
    int inProgressCount,
    int resolvedCount,
  });
}

/// @nodoc
class __$$AgentWorkloadImplCopyWithImpl<$Res>
    extends _$AgentWorkloadCopyWithImpl<$Res, _$AgentWorkloadImpl>
    implements _$$AgentWorkloadImplCopyWith<$Res> {
  __$$AgentWorkloadImplCopyWithImpl(
    _$AgentWorkloadImpl _value,
    $Res Function(_$AgentWorkloadImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AgentWorkload
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? userId = null,
    Object? name = null,
    Object? department = null,
    Object? openCount = null,
    Object? inProgressCount = null,
    Object? resolvedCount = null,
  }) {
    return _then(
      _$AgentWorkloadImpl(
        userId: null == userId
            ? _value.userId
            : userId // ignore: cast_nullable_to_non_nullable
                  as String,
        name: null == name
            ? _value.name
            : name // ignore: cast_nullable_to_non_nullable
                  as String,
        department: null == department
            ? _value.department
            : department // ignore: cast_nullable_to_non_nullable
                  as Department,
        openCount: null == openCount
            ? _value.openCount
            : openCount // ignore: cast_nullable_to_non_nullable
                  as int,
        inProgressCount: null == inProgressCount
            ? _value.inProgressCount
            : inProgressCount // ignore: cast_nullable_to_non_nullable
                  as int,
        resolvedCount: null == resolvedCount
            ? _value.resolvedCount
            : resolvedCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$AgentWorkloadImpl implements _AgentWorkload {
  const _$AgentWorkloadImpl({
    required this.userId,
    required this.name,
    required this.department,
    required this.openCount,
    required this.inProgressCount,
    required this.resolvedCount,
  });

  factory _$AgentWorkloadImpl.fromJson(Map<String, dynamic> json) =>
      _$$AgentWorkloadImplFromJson(json);

  @override
  final String userId;
  @override
  final String name;
  @override
  final Department department;
  @override
  final int openCount;
  @override
  final int inProgressCount;
  @override
  final int resolvedCount;

  @override
  String toString() {
    return 'AgentWorkload(userId: $userId, name: $name, department: $department, openCount: $openCount, inProgressCount: $inProgressCount, resolvedCount: $resolvedCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AgentWorkloadImpl &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.department, department) ||
                other.department == department) &&
            (identical(other.openCount, openCount) ||
                other.openCount == openCount) &&
            (identical(other.inProgressCount, inProgressCount) ||
                other.inProgressCount == inProgressCount) &&
            (identical(other.resolvedCount, resolvedCount) ||
                other.resolvedCount == resolvedCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    userId,
    name,
    department,
    openCount,
    inProgressCount,
    resolvedCount,
  );

  /// Create a copy of AgentWorkload
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AgentWorkloadImplCopyWith<_$AgentWorkloadImpl> get copyWith =>
      __$$AgentWorkloadImplCopyWithImpl<_$AgentWorkloadImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AgentWorkloadImplToJson(this);
  }
}

abstract class _AgentWorkload implements AgentWorkload {
  const factory _AgentWorkload({
    required final String userId,
    required final String name,
    required final Department department,
    required final int openCount,
    required final int inProgressCount,
    required final int resolvedCount,
  }) = _$AgentWorkloadImpl;

  factory _AgentWorkload.fromJson(Map<String, dynamic> json) =
      _$AgentWorkloadImpl.fromJson;

  @override
  String get userId;
  @override
  String get name;
  @override
  Department get department;
  @override
  int get openCount;
  @override
  int get inProgressCount;
  @override
  int get resolvedCount;

  /// Create a copy of AgentWorkload
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AgentWorkloadImplCopyWith<_$AgentWorkloadImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
