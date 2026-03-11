import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
// import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:logging/logging.dart';
import 'package:provider/provider.dart';

import 'components/ad_banner.dart';
import 'firebase_options.dart';
import 'screens/account_screen.dart';
import 'screens/add_vehicle_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/calendar_preferences_screen.dart';
import 'screens/contact_screen.dart';
import 'screens/edit_vehicle_screen.dart';
import 'screens/email_preferences_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/instructions_screen.dart';
import 'screens/login_screen.dart';
import 'screens/maintenance_detail_screen.dart';
import 'screens/maintenance_list_screen.dart';
import 'screens/marketing_welcome_screen.dart';
import 'screens/offline_settings_screen.dart';
import 'screens/premium_screen.dart';
import 'screens/privacy_screen.dart';
import 'screens/records_screen.dart';
import 'screens/scan_vin_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/terms_screen.dart';
import 'screens/upcoming_tasks_screen.dart';
import 'services/analytics_service.dart';
import 'services/auth_service.dart';
import 'services/firestore_service.dart';
import 'services/notification_service.dart';
import 'services/offline_service.dart';
import 'services/premium_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize logging
  Logger.root.level = Level.ALL;
  Logger.root.onRecord.listen((record) {
    debugPrint(
      '${record.level.name}: ${record.time}: ${record.loggerName}: ${record.message}',
    );
  });

  // Initialize Firebase with explicit options to avoid environment drift.
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    final activeOptions = Firebase.app().options;
    debugPrint(
      'Firebase initialized: project=${activeOptions.projectId}, appId=${activeOptions.appId}',
    );
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
    rethrow;
  }

  // Initialize Google Mobile Ads - DISABLED FOR TESTFLIGHT
  // await MobileAds.instance.initialize();

  // Initialize notifications.
  final notificationService = NotificationService();
  await notificationService.initialize();

  // Pre-load interstitial and rewarded ads - DISABLED FOR TESTFLIGHT
  // InterstitialAdHelper.loadAd();
  // RewardedAdHelper.loadAd();

  runApp(VehicleVitalsApp(notificationService: notificationService));
}

class VehicleVitalsApp extends StatelessWidget {
  final NotificationService notificationService;

  const VehicleVitalsApp({super.key, required this.notificationService});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AuthService()),
        Provider(create: (context) => FirestoreService()),
        Provider(create: (context) => notificationService),
        ChangeNotifierProvider(create: (context) => PremiumService()),
        ChangeNotifierProvider(create: (context) => OfflineService()),
        ChangeNotifierProvider(create: (context) => AnalyticsService()),
      ],
      child: Consumer<AuthService>(
        builder: (context, authService, child) {
          return MaterialApp.router(
            title: 'Vehicle Vitals',
            theme: AppTheme.lightTheme(),
            darkTheme: AppTheme.darkTheme(),
            themeMode: ThemeMode.system,
            routerConfig: _createRouter(authService),
            builder: (context, child) {
              return Column(
                children: [
                  const SafeArea(
                    bottom: false,
                    child: AdBanner(margin: EdgeInsets.zero),
                  ),
                  Expanded(child: child ?? const SizedBox.shrink()),
                ],
              );
            },
          );
        },
      ),
    );
  }

  GoRouter _createRouter(AuthService authService) {
    return GoRouter(
      initialLocation: '/marketing',
      redirect: (context, state) {
        final isLoggedIn = authService.currentUser != null;
        final isLoading = authService.isLoading;
        final location = state.matchedLocation;

        final isAuthRoute = location.startsWith('/auth/');
        final isMarketingRoute = location == '/marketing';
        final isAppRoute = location == '/app' || location.startsWith('/app/');

        if (isLoading) return null; // Don't redirect while loading

        // Unauthenticated users may only access marketing or auth routes.
        if (!isLoggedIn && isAppRoute) {
          return '/auth/login';
        }

        // Authenticated users are routed into the secure app namespace.
        if (isLoggedIn && (isAuthRoute || isMarketingRoute)) {
          return '/app';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/marketing',
          builder: (context, state) => const MarketingWelcomeScreen(),
        ),
        GoRoute(
          path: '/auth/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/auth/signup',
          builder: (context, state) => const SignUpScreen(),
        ),
        GoRoute(
          path: '/auth/forgot-password',
          builder: (context, state) => const ForgotPasswordScreen(),
        ),
        GoRoute(path: '/app', builder: (context, state) => const HomeScreen()),
        GoRoute(
          path: '/app/add-vehicle',
          builder: (context, state) => const AddVehicleScreen(),
        ),
        GoRoute(
          path: '/app/add-vehicle/:vin',
          builder: (context, state) =>
              AddVehicleScreen(initialVin: state.pathParameters['vin']),
        ),
        GoRoute(
          path: '/app/edit-vehicle/:vin',
          builder: (context, state) =>
              EditVehicleScreen(vin: state.pathParameters['vin']!),
        ),
        GoRoute(
          path: '/app/records/:vin',
          builder: (context, state) =>
              RecordsScreen(vin: state.pathParameters['vin']!),
        ),
        GoRoute(
          path: '/app/scan-vin',
          builder: (context, state) => const ScanVINScreen(),
        ),
        GoRoute(
          path: '/app/maintenance/:vin',
          builder: (context, state) =>
              MaintenanceListScreen(vin: state.pathParameters['vin']!),
        ),
        GoRoute(
          path: '/app/maintenance/:vin/:entryId',
          builder: (context, state) => MaintenanceDetailScreen(
            vin: state.pathParameters['vin']!,
            entryId: state.pathParameters['entryId']!,
          ),
        ),
        GoRoute(
          path: '/app/account',
          builder: (context, state) => const AccountScreen(),
        ),
        GoRoute(
          path: '/app/email-preferences',
          builder: (context, state) => const EmailPreferencesScreen(),
        ),
        GoRoute(
          path: '/app/contact',
          builder: (context, state) => const ContactScreen(),
        ),
        GoRoute(
          path: '/app/privacy',
          builder: (context, state) => const PrivacyScreen(),
        ),
        GoRoute(
          path: '/app/terms',
          builder: (context, state) => const TermsScreen(),
        ),
        GoRoute(
          path: '/app/instructions',
          builder: (context, state) => const InstructionsScreen(),
        ),
        GoRoute(
          path: '/app/calendar-preferences',
          builder: (context, state) => const CalendarPreferencesScreen(),
        ),
        GoRoute(
          path: '/app/premium',
          builder: (context, state) => const PremiumScreen(),
        ),
        GoRoute(
          path: '/app/offline-settings',
          builder: (context, state) => const OfflineSettingsScreen(),
        ),
        GoRoute(
          path: '/app/analytics',
          builder: (context, state) => const AnalyticsScreen(),
        ),
        GoRoute(
          path: '/app/upcoming',
          builder: (context, state) => const UpcomingTasksScreen(),
        ),
        // Legacy routes for backward compatibility.
        GoRoute(path: '/', redirect: (context, state) => '/marketing'),
        GoRoute(path: '/login', redirect: (context, state) => '/auth/login'),
        GoRoute(path: '/signup', redirect: (context, state) => '/auth/signup'),
        GoRoute(
          path: '/forgot-password',
          redirect: (context, state) => '/auth/forgot-password',
        ),
        GoRoute(
          path: '/add-vehicle',
          redirect: (context, state) => '/app/add-vehicle',
        ),
        GoRoute(
          path: '/add-vehicle/:vin',
          redirect: (context, state) =>
              '/app/add-vehicle/${state.pathParameters['vin']}',
        ),
        GoRoute(
          path: '/edit-vehicle/:vin',
          redirect: (context, state) =>
              '/app/edit-vehicle/${state.pathParameters['vin']}',
        ),
        GoRoute(
          path: '/scan-vin',
          redirect: (context, state) => '/app/scan-vin',
        ),
        GoRoute(
          path: '/maintenance/:vin',
          redirect: (context, state) =>
              '/app/maintenance/${state.pathParameters['vin']}',
        ),
        GoRoute(
          path: '/maintenance/:vin/:entryId',
          redirect: (context, state) =>
              '/app/maintenance/${state.pathParameters['vin']}/${state.pathParameters['entryId']}',
        ),
        GoRoute(path: '/account', redirect: (context, state) => '/app/account'),
        GoRoute(
          path: '/email-preferences',
          redirect: (context, state) => '/app/email-preferences',
        ),
        GoRoute(path: '/contact', redirect: (context, state) => '/app/contact'),
        GoRoute(path: '/privacy', redirect: (context, state) => '/app/privacy'),
        GoRoute(path: '/terms', redirect: (context, state) => '/app/terms'),
        GoRoute(
          path: '/instructions',
          redirect: (context, state) => '/app/instructions',
        ),
        GoRoute(
          path: '/calendar-preferences',
          redirect: (context, state) => '/app/calendar-preferences',
        ),
        GoRoute(path: '/premium', redirect: (context, state) => '/app/premium'),
        GoRoute(
          path: '/offline-settings',
          redirect: (context, state) => '/app/offline-settings',
        ),
        GoRoute(
          path: '/analytics',
          redirect: (context, state) => '/app/analytics',
        ),
        GoRoute(
          path: '/upcoming',
          redirect: (context, state) => '/app/upcoming',
        ),
      ],
    );
  }
}
