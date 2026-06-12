import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:deskline/app/app.dart';

void main() {
  testWidgets('DesklineApp renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: DesklineApp(),
      ),
    );

    // App should show login screen when unauthenticated
    expect(find.text('LOGIN'), findsOneWidget);
  });
}
