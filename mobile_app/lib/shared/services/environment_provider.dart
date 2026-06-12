import 'package:flutter_riverpod/flutter_riverpod.dart';
enum DataSource { mock, api }
final dataSourceProvider = Provider<DataSource>((ref)=>DataSource.mock);