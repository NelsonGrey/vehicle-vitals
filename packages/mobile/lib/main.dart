import 'dart:async';
import 'dart:ui';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:logging/logging.dart';
import 'package:provider/provider.dart';

import 'components/ad_banner.dart';
import 'components/error_boundary.dart';
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
import 'screens/onboarding_screen.dart';
import 'screens/premium_screen.dart';
import 'screens/privacy_screen.dart';
import 'screens/records_screen.dart';
import 'screens/reminder_preferences_screen.dart';
import 'screens/scan_vin_screen.dart';
import 'screens/service_providers_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/terms_screen.dart';
import 'screens/timeline_dashboard_screen.dart';
import 'screens/upcoming_tasks_screen.dart';
import 'services/analytics_service.dart';
import 'services/auth_service.dart';
import 'services/firestore_service.dart';
import 'services/notification_service.dart';
import 'services/offline_service.dart';
import 'services/onboarding_service.dart';
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
      'Firebase initialized: env=${DefaultFirebaseOptions.currentEnvironmentLabel}, '
      'project=${activeOptions.projectId}, appId=${activeOptions.appId}',
    );

    // Wire Flutter and Dart error handlers to Crashlytics.
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
    rethrow;
  }

  // Initialize Google Mobile Ads.
  await MobileAds.instance.initialize();

  // Initialize notifications.
  final notificationService = NotificationService();
  await notificationService.initialize();

  // Pre-load interstitial and rewarded ads.
  InterstitialAdHelper.loadAd();
  RewardedAdHelper.loadAd();

  runApp(VehicleVitalsApp(notificationService: notificationService));
}

String _resolveInitialRoute() {
  final routeName = PlatformDispatcher.instance.defaultRouteName.trim();
  if (routeName.isEmpty || routeName == '/') {
    return '/welcome';
  }

  return routeName;
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
        ChangeNotifierProxyProvider<AuthService, PremiumService>(
          create: (context) => PremiumService(),
          update: (context, authService, premiumService) {
            final service = premiumService ?? PremiumService();
            unawaited(service.syncForAuthUser(authService.currentUser?.uid));
            return service;
          },
        ),
        ChangeNotifierProxyProvider<AuthService, OnboardingService>(
          create: (context) => OnboardingService(),
          update: (context, authService, onboardingService) {
            final service = onboardingService ?? OnboardingService();
            unawaited(service.syncForAuthUser(authService.currentUser?.uid));
            return service;
          },
        ),
        ChangeNotifierProvider(create: (context) => OfflineService()),
        ChangeNotifierProvider(create: (context) => AnalyticsService()),
      ],
      child: Consumer2<AuthService, OnboardingService>(
        builder: (context, authService, onboardingService, child) {
          return ErrorWidgetWrapper(
            child: MaterialApp.router(
              title: 'Garage',
              theme: AppTheme.lightTheme(),
              darkTheme: AppTheme.darkTheme(),
              themeMode: ThemeMode.system,
              routerConfig: _createRouter(authService, onboardingService),
              builder: (context, child) {
                return Column(
                  children: [
                    if (kDebugMode) const _DebugFirebaseEnvBanner(),
                    const SafeArea(
                      bottom: false,
                      child: AdBanner(margin: EdgeInsets.zero),
                    ),
                    Expanded(child: child ?? const SizedBox.shrink()),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }

  GoRouter _createRouter(
    AuthService authService,
    OnboardingService onboardingService,
  ) {
    return GoRouter(
      initialLocation: _resolveInitialRoute(),
      redirect: (context, state) {
        final isLoggedIn = authService.currentUser != null;
        final isLoading = authService.isLoading;
        final onboardingLoading = onboardingService.isLoading;
        final onboardingCompleted = onboardingService.isCompleted;
        final location = state.matchedLocation;

        final isAuthRoute = location.startsWith('/auth/');
        final isWelcomeRoute =
            location == '/welcome' || location == '/marketing';
        final isAppRoute = location == '/app' || location.startsWith('/app/');
        final isOnboardingRoute = location == '/app/onboarding';
        final isAllowedSetupRoute =
            isOnboardingRoute ||
            location.startsWith('/app/add-vehicle') ||
            location == '/app/reminder-preferences' ||
            location == '/app/premium' ||
            location == '/app/contact';

        if (isLoading) return null; // Don't redirect while loading

        // Unauthenticated users may only access welcome or auth routes.
        if (!isLoggedIn && isAppRoute) {
          return '/auth/login';
        }

        if (!isLoggedIn) {
          return null;
        }

        if (onboardingLoading) {
          return null;
        }

        final needsOnboarding = !onboardingCompleted;

        // Authenticated users are routed into the secure app namespace.
        if (isAuthRoute || isWelcomeRoute) {
          return needsOnboarding ? '/app/onboarding' : '/app';
        }

        if (needsOnboarding && isAppRoute && !isAllowedSetupRoute) {
          return '/app/onboarding';
        }

        if (!needsOnboarding && isOnboardingRoute) {
          return '/app';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/welcome',
          builder: (context, state) => const WelcomeScreen(),
        ),
        GoRoute(
          path: '/marketing',
          builder: (context, state) => const WelcomeScreen(),
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
        GoRoute(
          path: '/app/onboarding',
          builder: (context, state) => const OnboardingScreen(),
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
          path: '/app/profile',
          builder: (context, state) => const AccountScreen(),
        ),
        GoRoute(
          path: '/app/account',
          redirect: (context, state) => '/app/profile',
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
          path: '/app/reminder-preferences',
          builder: (context, state) => const ReminderPreferencesScreen(),
        ),
        GoRoute(
          path: '/app/service-providers',
          builder: (context, state) => const ServiceProvidersScreen(),
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
        GoRoute(
          path: '/app/timeline',
          builder: (context, state) => const TimelineDashboardScreen(),
        ),
        // Legacy routes for backward compatibility.
        GoRoute(path: '/', redirect: (context, state) => '/welcome'),
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
        GoRoute(path: '/profile', redirect: (context, state) => '/app/profile'),
        GoRoute(path: '/account', redirect: (context, state) => '/app/profile'),
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
        GoRoute(
          path: '/timeline',
          redirect: (context, state) => '/app/timeline',
        ),
      ],
    );
  }
}

class _DebugFirebaseEnvBanner extends StatelessWidget {
  const _DebugFirebaseEnvBanner();

  @override
  Widget build(BuildContext context) {
    final options = Firebase.app().options;
    final env = DefaultFirebaseOptions.currentEnvironmentLabel;
    final projectId = options.projectId;

    return SafeArea(
      bottom: false,
      child: Container(
        width: double.infinity,
        color: Colors.amber.shade700,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Text(
          'DEBUG Firebase env=$env | project=$projectId',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.black,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
