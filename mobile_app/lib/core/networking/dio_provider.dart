import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/services/secure_storage_provider.dart';
import 'dio_client.dart';

/// Provides the configured [DioClient] with auth interceptors.
///
/// Depends on [secureStorageProvider] for token management.
/// The [onSessionExpired] callback can be used by auth state to force logout.
final dioClientProvider = Provider<DioClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return DioClient(storage);
});
