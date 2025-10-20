// File: web/src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import EnvironmentGate from './components/EnvironmentGate';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './shared/AuthContext';
import { analytics, logger } from './utils/logger';

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

  // Track page views
  useEffect(() => {
    const startTime = Date.now();
    logger.info(`Page view: ${location.pathname}`, {
      category: 'navigation',
      data: { path: location.pathname, search: location.search },
    });

    // Track page view in analytics
    analytics.trackEvent('page_view', {
      page_path: location.pathname,
      page_title: document.title,
    });

    // Track time spent on page when leaving
    return () => {
      const timeSpent = Date.now() - startTime;
      logger.info(`Page exit: ${location.pathname}`, {
        category: 'navigation',
        data: { path: location.pathname, timeSpent },
      });
    };
  }, [location]);

  return null; // This component doesn't render anything
}

// Public pages - lazy loaded
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Instructions = lazy(() => import('./pages/Instructions'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

// Protected pages - lazy loaded
const Home = lazy(() => import('./pages/Home'));
const AddVehicle = lazy(() => import('./pages/AddVehicle'));
const EditVehicle = lazy(() => import('./pages/EditVehicle'));
const Profile = lazy(() => import('./pages/Profile'));
const DevSeed = lazy(() => import('./pages/DevSeed'));
const TimelineDashboard = lazy(() => import('./pages/TimelineDashboard'));
const UpcomingTasks = lazy(() => import('./pages/UpcomingTasks'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  // Check if we should show the coming soon page
  const showComingSoon = import.meta.env.VITE_SHOW_COMING_SOON === 'true';
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  // Track app initialization
  useEffect(() => {
    const initTime = Date.now();
    logger.info('App initialized', {
      category: 'app',
      data: {
        environment: import.meta.env.MODE,
        showComingSoon,
        appEnvironment: environment,
      },
    });

    // Track app load performance
    const loadTime = Date.now() - initTime;
    analytics.trackTiming('app_load', loadTime, 'app');

    return () => {
      logger.info('App unmounting', { category: 'app' });
    };
  }, [showComingSoon, environment]);

  // Show Coming Soon page if flag is enabled
  if (showComingSoon) {
    return (
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <ComingSoon />
        </Suspense>
      </BrowserRouter>
    );
  }

  console.log('App component rendering with full routing');

  const appContent = (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <AppAnalytics />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Landing page without layout */}
            <Route path="/" element={<Landing />} />

            {/* Routes with layout */}
            <Route path="/" element={<Layout />}>
              {/* Public routes */}
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<SignUp />} />
              <Route path="instructions" element={<Instructions />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />

              {/* Protected routes */}
              <Route
                path="app"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add-vehicle"
                element={
                  <ProtectedRoute>
                    <AddVehicle />
                  </ProtectedRoute>
                }
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
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="timeline"
                element={
                  <ProtectedRoute>
                    <TimelineDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="upcoming"
                element={
                  <ProtectedRoute>
                    <UpcomingTasks />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Development route - remove in production */}
            <Route path="/dev-seed" element={<DevSeed />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );

  // Wrap with environment gate for staging and dev
  return (
    <EnvironmentGate environment={environment}>{appContent}</EnvironmentGate>
  );
}

export default App;
