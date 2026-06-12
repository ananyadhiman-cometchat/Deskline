import 'package:flutter_riverpod/flutter_riverpod.dart';

enum DataSource { mock, api }

/// Toggle between mock and real API data sources.
/// Set to [DataSource.api] to use the real backend.
final dataSourceProvider = Provider<DataSource>((ref) => DataSource.api);
