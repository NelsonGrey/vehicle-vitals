import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'firebase_options.dart';
import 'services/auth_service.dart';
import 'services/firestore_service.dart';
import 'services/notification_service.dart';
import 'services/premium_service.dart';
import 'services/offline_service.dart';
import 'services/analytics_service.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/add_vehicle_screen.dart';
import 'screens/edit_vehicle_screen.dart';
import 'screens/scan_vin_screen.dart';
import 'screens/maintenance_list_screen.dart';
import 'screens/maintenance_detail_screen.dart';
import 'screens/account_screen.dart';
import 'screens/contact_screen.dart';
import 'screens/privacy_screen.dart';
import 'screens/terms_screen.dart';
import 'screens/instructions_screen.dart';
import 'screens/email_preferences_screen.dart';
import 'screens/calendar_preferences_screen.dart';
import 'components/ad_banner.dart';
import 'screens/premium_screen.dart';
import 'screens/offline_settings_screen.dart';
import 'screens/analytics_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Initialize Google Mobile Ads
  await MobileAds.instance.initialize();

  // Initialize notifications
  final notificationService = NotificationService();
  await notificationService.initialize();

  // Pre-load interstitial and rewarded ads
  InterstitialAdHelper.loadAd();
  RewardedAdHelper.loadAd();

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
          );
        },
      ),
    );
  }

  GoRouter _createRouter(AuthService authService) {
    return GoRouter(
      initialLocation: '/',
      redirect: (context, state) {
        final isLoggedIn = authService.currentUser != null;
        final isLoading = authService.isLoading;

        if (isLoading) return null; // Don't redirect while loading

        // Redirect to login if not authenticated and trying to access protected routes
        if (!isLoggedIn &&
            state.matchedLocation != '/login' &&
            state.matchedLocation != '/signup') {
          return '/login';
        }

        // Redirect to home if authenticated and on login/signup pages
        if (isLoggedIn &&
            (state.matchedLocation == '/login' ||
                state.matchedLocation == '/signup')) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => const SignUpScreen(),
        ),
        GoRoute(
          path: '/add-vehicle/:vin?',
          builder: (context, state) =>
              AddVehicleScreen(initialVin: state.pathParameters['vin']),
        ),
        GoRoute(
          path: '/edit-vehicle/:vin',
          builder: (context, state) =>
              EditVehicleScreen(vin: state.pathParameters['vin']!),
        ),
        GoRoute(
          path: '/scan-vin',
          builder: (context, state) => const ScanVINScreen(),
        ),
        GoRoute(
          path: '/maintenance/:vin',
          builder: (context, state) =>
              MaintenanceListScreen(vin: state.pathParameters['vin']!),
        ),
        GoRoute(
          path: '/maintenance/:vin/:entryId',
          builder: (context, state) => MaintenanceDetailScreen(
            vin: state.pathParameters['vin']!,
            entryId: state.pathParameters['entryId']!,
          ),
        ),
        GoRoute(
          path: '/account',
          builder: (context, state) => const AccountScreen(),
        ),
        GoRoute(
          path: '/email-preferences',
          builder: (context, state) => const EmailPreferencesScreen(),
        ),
        GoRoute(
          path: '/contact',
          builder: (context, state) => const ContactScreen(),
        ),
        GoRoute(
          path: '/privacy',
          builder: (context, state) => const PrivacyScreen(),
        ),
        GoRoute(
          path: '/terms',
          builder: (context, state) => const TermsScreen(),
        ),
        GoRoute(
          path: '/instructions',
          builder: (context, state) => const InstructionsScreen(),
        ),
        GoRoute(
          path: '/calendar-preferences',
          builder: (context, state) => const CalendarPreferencesScreen(),
        ),
        GoRoute(
          path: '/premium',
          builder: (context, state) => const PremiumScreen(),
        ),
        GoRoute(
          path: '/offline-settings',
          builder: (context, state) => const OfflineSettingsScreen(),
        ),
        GoRoute(
          path: '/analytics',
          builder: (context, state) => const AnalyticsScreen(),
        ),
      ],
    );
  }
}
