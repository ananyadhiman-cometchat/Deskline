import 'dart:async';

class RefreshService {
  const RefreshService._();

  static Future<void> simulateRefresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
  }
}