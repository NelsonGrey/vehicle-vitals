// File: web/src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import CookieConsentBanner from './components/CookieConsentBanner';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import AdminSupport from './pages/AdminSupport';
import { AuthProvider, useAuth } from './shared/AuthContext';
import { DEFAULT_APP_REDIRECT } from './shared/authRedirect';
import {
  appEnvironment,
  isDevelopmentEnvironment,
  isMarketingOnlyEnvironment,
} from './shared/environment';
import {
  buildReminderNotificationPath,
  subscribeToForegroundMessages,
} from './shared/notificationService';
import { replayStoredConsent } from './shared/consent';
import { captureUtmParams } from './shared/marketingAnalytics';
import { analytics, logger } from './utils/logger';

// Replay any previously stored consent decision into GTM on every page load.
replayStoredConsent();

// Capture UTM params from the landing URL before any navigation occurs.
captureUtmParams();

// Component to handle logging and analytics
function AppAnalytics() {
  const { user } = useAuth();
  const location = useLocation();

  // Track user authentication state changes
  useEffect(() => {
    if (user) {
      // User logged in
      analytics.setUser(user.uid, {
        email: user.email,
        provider: user.providerData[0]?.providerId || 'unknown',
        createdAt: user.metadata.creationTime,
        lastLogin: user.metadata.lastSignInTime,
      });
      logger.info('User authenticated', {
        category: 'auth',
        data: { userId: user.uid, email: user.email },
      });
    } else {
      // User logged out
      analytics.clearUser();
      logger.info('User logged out', { category: 'auth' });
    }
  }, [user]);

  // Track page views. Use a microtask delay so PageSEO's useEffect (which
  // updates document.title) runs first, giving us the correct route title.
  useEffect(() => {
    const startTime = Date.now();
    logger.info(`Page view: ${location.pathname}`, {
      category: 'navigation',
      data: { path: location.pathname, search: location.search },
    });

    const id = setTimeout(() => {
      analytics.trackEvent('page_view', {
        page_path: location.pathname,
        page_search: location.search,
        page_title: document.title,
      });
    }, 0);

    // Track time spent on page when leaving
    return () => {
      clearTimeout(id);
      const timeSpent = Date.now() - startTime;
      logger.info(`Page exit: ${location.pathname}`, {
        category: 'navigation',
        data: { path: location.pathname, timeSpent },
      });
    };
  }, [location]);

  return null; // This component doesn't render anything
}

function AppNotificationBridge() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let unsubscribe = () => {};
    let isActive = true;

    void subscribeToForegroundMessages(payload => {
      const notificationTitle = payload.notification?.title || 'Vehicle Vitals';
      const notificationBody =
        payload.notification?.body || 'You have a maintenance reminder.';
      const destination = buildReminderNotificationPath(payload.data);

      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const notification = new Notification(notificationTitle, {
          body: notificationBody,
          tag: payload.data?.tag || 'vehicle-vitals-notification',
        });

        notification.onclick = () => {
          window.focus();
          navigate(destination);
          notification.close();
        };
        return;
      }

      window.alert(`${notificationTitle}\n\n${notificationBody}`);
      navigate(destination);
    }).then(nextUnsubscribe => {
      if (!isActive) {
        nextUnsubscribe();
        return;
      }

      unsubscribe = nextUnsubscribe;
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [navigate, user]);

  return null;
}

// Public pages - lazy loaded
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const FeatureDemo = lazy(() => import('./pages/FeatureDemo'));
const Instructions = lazy(() => import('./pages/Instructions'));
const Help = lazy(() => import('./pages/Help'));
const StartSteps = lazy(() => import('./pages/StartSteps'));
const EverydayScreens = lazy(() => import('./pages/EverydayScreens'));
const ShortVideoTours = lazy(() => import('./pages/ShortVideoTours'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const PersonaPage = lazy(() => import('./pages/PersonaPage'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

// Protected pages - lazy loaded
const Home = lazy(() => import('./pages/Home'));
const AddVehicle = lazy(() => import('./pages/AddVehicle'));
const EditVehicle = lazy(() => import('./pages/EditVehicle'));
const Records = lazy(() => import('./pages/Records'));
const Profile = lazy(() => import('./pages/Profile'));
const ServiceProviders = lazy(() => import('./pages/ServiceProviders'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const TimelineDashboard = lazy(() => import('./pages/TimelineDashboard'));
const UpcomingTasks = lazy(() => import('./pages/UpcomingTasks'));
const DevSeed = lazy(() => import('./pages/DevSeed'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600 dark:border-slate-300"></div>
  </div>
);

function MarketingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user && !user.isAnonymous) {
    return <Navigate to={DEFAULT_APP_REDIRECT} replace />;
  }

  return <>{children}</>;
}

function AuthOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user && !user.isAnonymous) {
    return <Navigate to={DEFAULT_APP_REDIRECT} replace />;
  }

  return <Outlet />;
}

function App() {
  // Check if we should show the coming soon page
  const environment = appEnvironment;
  const showComingSoon = import.meta.env.VITE_SHOW_COMING_SOON === 'true';
  const marketingOnlyMode = isMarketingOnlyEnvironment;

  // Track app initialization
  useEffect(() => {
    const initTime = Date.now();
    logger.info('App initialized', {
      category: 'app',
      data: {
        environment,
        buildMode: import.meta.env.MODE,
        showComingSoon,
        marketingOnlyMode,
      },
    });

    // Track app load performance
    const loadTime = Date.now() - initTime;
    analytics.trackTiming('app_load', loadTime, 'app');

    return () => {
      logger.info('App unmounting', { category: 'app' });
    };
  }, [showComingSoon, environment, marketingOnlyMode]);

  // Show Coming Soon page if flag is enabled
  if (showComingSoon) {
    return (
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <ComingSoon />
        </Suspense>
      </BrowserRouter>
    );
  }

  const appContent = (
    <BrowserRouter>
      <AuthProvider>
        <AppAnalytics />
        <AppNotificationBridge />
        <CookieConsentBanner />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Marketing (anonymous) pages */}
            <Route
              path="/"
              element={
                <MarketingRoute>
                  <Landing />
                </MarketingRoute>
              }
            />

            {/* Marketing and user-app routes with main layout */}
            <Route path="/" element={<Layout />}>
              <Route
                path="vin-lookup-demo"
                element={
                  <FeatureDemo
                    title="VIN Lookup"
                    subtitle="See how we turn a raw VIN into a structured vehicle profile in seconds."
                    marketingBullets={[
                      'Enter a VIN and preview looked-up year, make, and model.',
                      'Understand how quick add reduces setup friction.',
                      'See the path from initial lookup to saved vehicle records.',
                    ]}
                    appRoute="/app/add-vehicle"
                    appCtaLabel="Open VIN Add Flow"
                  />
                }
              />
              <Route
                path="maintenance-planning-demo"
                element={
                  <FeatureDemo
                    title="Maintenance Planning"
                    subtitle="See how service planning becomes visible, organized, and predictable."
                    marketingBullets={[
                      'Preview scheduled maintenance workflows and reminders.',
                      'Understand how timeline and upcoming tasks connect.',
                      'See how service history supports long-term ownership.',
                    ]}
                    appRoute="/app/upcoming"
                    appCtaLabel="Open Upcoming Tasks"
                  />
                }
              />
              <Route
                path="cross-platform-access-demo"
                element={
                  <FeatureDemo
                    title="Cross Platform Access"
                    subtitle="See how the same garage data follows users across devices."
                    marketingBullets={[
                      'Understand web and mobile continuity from one account.',
                      'Preview secure sign-in and shared data behavior.',
                      'See where users continue work from any platform.',
                    ]}
                    appRoute="/app"
                    appCtaLabel="Open Garage Dashboard"
                  />
                }
              />
              <Route
                path="ownership-history-demo"
                element={
                  <FeatureDemo
                    title="Ownership History"
                    subtitle="See how long-term maintenance records become a single source of truth."
                    marketingBullets={[
                      'Preview complete vehicle history and service chronology.',
                      'Understand resale and ownership confidence benefits.',
                      'See where records are maintained behind secure access.',
                    ]}
                    appRoute="/app/timeline"
                    appCtaLabel="Open Timeline View"
                  />
                }
              />

              <Route path="instructions" element={<Instructions />} />
              <Route path="getting-started" element={<Instructions />} />
              <Route path="help" element={<Help />} />
              <Route path="start-steps" element={<StartSteps />} />
              <Route path="everyday-screens" element={<EverydayScreens />} />
              <Route path="short-video-tours" element={<ShortVideoTours />} />
              <Route path="support" element={<Contact />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="personas/:personaId" element={<PersonaPage />} />

              {/* Legacy auth URLs */}
              <Route
                path="login"
                element={<Navigate to="/auth/login" replace />}
              />
              <Route
                path="signup"
                element={<Navigate to="/auth/signup" replace />}
              />
              <Route
                path="forgot-password"
                element={<Navigate to="/auth/forgot-password" replace />}
              />

              {/* Protected user application */}
              {marketingOnlyMode ? (
                <>
                  <Route path="app/*" element={<Navigate to="/" replace />} />
                  <Route
                    path="add-vehicle"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="edit-vehicle/:vin"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="providers"
                    element={<Navigate to="/" replace />}
                  />
                  <Route path="profile" element={<Navigate to="/" replace />} />
                  <Route
                    path="timeline"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="upcoming"
                    element={<Navigate to="/" replace />}
                  />
                </>
              ) : (
                <>
                  <Route
                    path="app"
                    element={
                      <ProtectedRoute>
                        <Outlet />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Home />} />
                    <Route path="add-vehicle" element={<AddVehicle />} />
                    <Route path="edit-vehicle/:vin" element={<EditVehicle />} />
                    <Route path="records/:vin" element={<Records />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="subscription" element={<SubscriptionPage />} />
                    <Route path="providers" element={<ServiceProviders />} />
                    <Route path="timeline" element={<TimelineDashboard />} />
                    <Route path="upcoming" element={<UpcomingTasks />} />
                    <Route
                      path="admin"
                      element={
                        <SuperAdminRoute>
                          <Outlet />
                        </SuperAdminRoute>
                      }
                    >
                      <Route index element={<AdminSupport />} />
                    </Route>
                    {isDevelopmentEnvironment && (
                      <Route path="dev-seed" element={<DevSeed />} />
                    )}
                  </Route>

                  {/* Legacy protected URLs */}
                  <Route
                    path="add-vehicle"
                    element={<Navigate to="/app/add-vehicle" replace />}
                  />
                  <Route
                    path="edit-vehicle/:vin"
                    element={
                      <ProtectedRoute>
                        <EditVehicle />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="providers"
                    element={<Navigate to="/app/providers" replace />}
                  />
                  <Route
                    path="profile"
                    element={<Navigate to="/app/profile" replace />}
                  />
                  <Route path="subscription" element={<SubscriptionPage />} />
                  <Route
                    path="timeline"
                    element={<Navigate to="/app/timeline" replace />}
                  />
                  <Route
                    path="upcoming"
                    element={<Navigate to="/app/upcoming" replace />}
                  />
                </>
              )}
            </Route>

            {/* Authentication and authorization routes */}
            {marketingOnlyMode ? (
              <Route path="/auth/*" element={<Navigate to="/" replace />} />
            ) : (
              <Route path="/auth" element={<AuthOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<SignUp />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                </Route>
              </Route>
            )}

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('Application error', {
          category: 'error',
          data: {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
        });
      }}
    >
      {appContent}
    </ErrorBoundary>
  );
}

export default App;
