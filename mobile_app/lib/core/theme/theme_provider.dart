import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Provides the current [ThemeMode] for the app.
/// Persists selection to secure storage so it survives app restarts.
final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

/// StateNotifier managing the app's theme mode.
/// Reads from and writes to [FlutterSecureStorage] for persistence.
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  static const _storageKey = 'theme_mode';
  final FlutterSecureStorage _storage;

  ThemeModeNotifier()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        ),
        super(ThemeMode.light) {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final stored = await _storage.read(key: _storageKey);
      if (stored != null) {
        state = _parseThemeMode(stored);
      }
    } catch (_) {
      // If read fails, keep default (light)
    }
  }

  /// Toggle between light and dark modes.
  Future<void> toggle() async {
    final next = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = next;
    await _storage.write(key: _storageKey, value: next.name);
  }

  /// Set a specific theme mode.
  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _storage.write(key: _storageKey, value: mode.name);
  }

  /// Whether the current mode is dark.
  bool get isDark => state == ThemeMode.dark;

  static ThemeMode _parseThemeMode(String value) {
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.light;
    }
  }
}
