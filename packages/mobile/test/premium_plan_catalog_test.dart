import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vehicle_vitals_flutter/screens/premium_screen.dart';

// Use Material 2 theme in all tests to avoid InkSparkle shader asset version
// mismatch that occurs when the test runtime's compiled shader format version
// does not match the Flutter framework expectation.
final _testTheme = ThemeData(useMaterial3: false);

void main() {
  testWidgets('renders all four subscription tiers and base labels', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: _testTheme,
        home: Scaffold(
          body: SingleChildScrollView(
            child: PremiumPlanCatalog(
              currentTier: 'free',
              isLoading: false,
              premiumPrice: r'$4.99',
              onChoosePremium: () {},
              onContactSales: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('Subscription options'), findsOneWidget);
    expect(find.text('Free'), findsOneWidget);
    expect(find.text('Pro'), findsOneWidget);
    expect(find.text('Premium'), findsOneWidget);
    expect(find.text('Enterprise'), findsOneWidget);
    expect(find.text('Contact Sales'), findsOneWidget);
  });

  testWidgets('tapping contact sales invokes callback exactly once', (
    WidgetTester tester,
  ) async {
    int contactSalesTapped = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: _testTheme,
        home: Scaffold(
          body: SingleChildScrollView(
            child: PremiumPlanCatalog(
              currentTier: 'free',
              isLoading: false,
              premiumPrice: r'$4.99',
              onChoosePremium: () {},
              onContactSales: () {
                contactSalesTapped += 1;
              },
            ),
          ),
        ),
      ),
    );

    await tester.scrollUntilVisible(
      find.widgetWithText(ElevatedButton, 'Contact Sales'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Contact Sales'));
    await tester.pump();

    expect(contactSalesTapped, 1);
  });
}
