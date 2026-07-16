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
              billingPeriod: 'monthly',
              proPrice: r'$2.99/mo',
              premiumPrice: r'$4.99',
              onChoosePro: () {},
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
              billingPeriod: 'monthly',
              proPrice: r'$2.99/mo',
              premiumPrice: r'$4.99',
              onChoosePro: () {},
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

  testWidgets('tapping choose pro invokes callback exactly once', (
    WidgetTester tester,
  ) async {
    int proTapped = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: _testTheme,
        home: Scaffold(
          body: SingleChildScrollView(
            child: PremiumPlanCatalog(
              currentTier: 'free',
              isLoading: false,
              billingPeriod: 'monthly',
              proPrice: r'$2.99/mo',
              premiumPrice: r'$4.99',
              onChoosePro: () {
                proTapped += 1;
              },
              onChoosePremium: () {},
              onContactSales: () {},
            ),
          ),
        ),
      ),
    );

    final proButton = find.widgetWithText(ElevatedButton, 'Choose Pro');
    expect(proButton, findsOneWidget);
    expect(tester.widget<ElevatedButton>(proButton).onPressed, isNotNull);

    await tester.tap(proButton);
    await tester.pump();

    expect(proTapped, 1);
  });

  testWidgets('tapping choose premium invokes callback exactly once', (
    WidgetTester tester,
  ) async {
    int premiumTapped = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: _testTheme,
        home: Scaffold(
          body: SingleChildScrollView(
            child: PremiumPlanCatalog(
              currentTier: 'free',
              isLoading: false,
              billingPeriod: 'monthly',
              proPrice: r'$2.99/mo',
              premiumPrice: r'$4.99',
              onChoosePro: () {},
              onChoosePremium: () {
                premiumTapped += 1;
              },
              onContactSales: () {},
            ),
          ),
        ),
      ),
    );

    await tester.scrollUntilVisible(
      find.widgetWithText(ElevatedButton, 'Choose Premium'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Choose Premium'));
    await tester.pump();

    expect(premiumTapped, 1);
  });

  testWidgets('shows marketing taglines for all four tiers', (
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
              billingPeriod: 'monthly',
              proPrice: null,
              premiumPrice: null,
              onChoosePro: () {},
              onChoosePremium: () {},
              onContactSales: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('Learn and document'), findsOneWidget);
    expect(find.text('Plan and coordinate'), findsOneWidget);
    expect(find.text('Forecast and automate'), findsOneWidget);
    expect(find.text('Govern and integrate'), findsOneWidget);
  });

  testWidgets(
    'falls back to web-aligned monthly pricing when no live product price is available',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: _testTheme,
          home: Scaffold(
            body: SingleChildScrollView(
              child: PremiumPlanCatalog(
                currentTier: 'free',
                isLoading: false,
                billingPeriod: 'monthly',
                proPrice: null,
                premiumPrice: null,
                onChoosePro: () {},
                onChoosePremium: () {},
                onContactSales: () {},
              ),
            ),
          ),
        ),
      );

      // Regression guard: these must match TIER_PRICING in
      // packages/web/src/shared/featureFlags.ts, not stale placeholder values.
      expect(find.text(r'$2.99/mo'), findsOneWidget);
      expect(find.text(r'$6.99/mo'), findsOneWidget);
      expect(find.text(r'$5/mo'), findsNothing);
      expect(find.text(r'$4.99'), findsNothing);
    },
  );

  testWidgets(
    'falls back to web-aligned annual pricing when no live product price is available',
    (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: _testTheme,
          home: Scaffold(
            body: SingleChildScrollView(
              child: PremiumPlanCatalog(
                currentTier: 'free',
                isLoading: false,
                billingPeriod: 'annual',
                proPrice: null,
                premiumPrice: null,
                onChoosePro: () {},
                onChoosePremium: () {},
                onContactSales: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.text(r'$29.99/yr'), findsOneWidget);
      expect(find.text(r'$69.99/yr'), findsOneWidget);
      expect(find.text(r'$2.99/mo'), findsNothing);
      expect(find.text(r'$6.99/mo'), findsNothing);
    },
  );
}
