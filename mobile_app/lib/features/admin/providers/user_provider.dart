import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_user_repository.dart';
import '../data/user_repository.dart';

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return MockUserRepository();
});
