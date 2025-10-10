// File: web/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import AuthAnonButton from './components/AuthAnonButton';
import DevStatusPanel from './components/DevStatusPanel';
import Layout from './components/Layout';

// Lazy load page components
const Home = lazy(() => import('./pages/Home'));
const Landing = lazy(() => import('./pages/Landing'));
const Instructions = lazy(() => import('./pages/Instructions'));
const Login = lazy(() => import('./pages/Login'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const AddVehicle = lazy(() => import('./pages/AddVehicle'));
const EditVehicle = lazy(() => import('./pages/EditVehicle'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Profile = lazy(() => import('./pages/Profile'));
const DevSeed = lazy(() => import('./pages/DevSeed'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

function App(): JSX.Element {
  const isComingSoonDomain = typeof window !== 'undefined' && ['vehicle-vitals.com', 'www.vehicle-vitals.com'].includes(window.location.hostname);
  return (
    <Router>
      <DevStatusPanel />
      {import.meta.env.DEV && <AuthAnonButton />}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {isComingSoonDomain ? (
            <Route element={<Layout forceOverlay />}>
              <Route path="*" element={<ComingSoon />} />
            </Route>
          ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/instructions" element={<Instructions />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/add-vehicle" element={<ProtectedRoute><AddVehicle /></ProtectedRoute>} />
            <Route path="/edit-vehicle/:vin" element={<ProtectedRoute><EditVehicle /></ProtectedRoute>} />
            {import.meta.env.DEV && <Route path="/dev/seed" element={<DevSeed />} />}
          </Route>
          )}
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;