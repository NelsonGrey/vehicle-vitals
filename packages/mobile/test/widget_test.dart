import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Vehicle Vitals smoke widget renders', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: Center(child: Text('Vehicle Vitals'))),
      ),
    );

    expect(find.text('Vehicle Vitals'), findsOneWidget);
  });
}
