/// CometChat configuration read from compile-time dart-define values.
///
/// Pass values at build time to override the defaults:
/// ```
/// flutter run --dart-define=COMETCHAT_APP_ID=xxx --dart-define=COMETCHAT_REGION=us
/// ```
///
/// App ID and Region are client-side, non-secret values (the same ones the
/// web app ships in its bundle via VITE_COMETCHAT_*). The Auth Key is never
/// embedded — auth tokens are minted server-side. Defaults let the app run
/// without requiring --dart-define on every build.
class CometChatConfig {
  const CometChatConfig._();

  /// CometChat App ID — required for SDK initialization.
  static const String appId = String.fromEnvironment(
    'COMETCHAT_APP_ID',
    defaultValue: '16802226f2533cd8a',
  );

  /// CometChat Region (e.g. "us", "eu", "in") — required for SDK init.
  static const String region = String.fromEnvironment(
    'COMETCHAT_REGION',
    defaultValue: 'in',
  );

  /// Whether the config has valid (non-empty) values.
  static bool get isConfigured => appId.isNotEmpty && region.isNotEmpty;
}
