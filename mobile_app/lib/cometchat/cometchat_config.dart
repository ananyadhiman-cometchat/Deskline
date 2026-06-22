/// CometChat configuration read from compile-time dart-define values.
///
/// Pass values at build time:
/// ```
/// flutter run --dart-define=COMETCHAT_APP_ID=xxx --dart-define=COMETCHAT_REGION=us
/// ```
class CometChatConfig {
  const CometChatConfig._();

  /// CometChat App ID — required for SDK initialization.
  static const String appId = String.fromEnvironment('COMETCHAT_APP_ID');

  /// CometChat Region (e.g. "us", "eu") — required for SDK initialization.
  static const String region = String.fromEnvironment('COMETCHAT_REGION');

  /// Whether the config has valid (non-empty) values.
  static bool get isConfigured => appId.isNotEmpty && region.isNotEmpty;
}
