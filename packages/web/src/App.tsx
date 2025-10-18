// File: web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './shared/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Instructions from './pages/Instructions';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ComingSoon from './pages/ComingSoon';

// Protected pages
import Home from './pages/Home';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import Profile from './pages/Profile';
import DevSeed from './pages/DevSeed';
import TimelineDashboard from './pages/TimelineDashboard';
import UpcomingTasks from './pages/UpcomingTasks';

function App() {
  // Check if we should show the coming soon page
  const showComingSoon = import.meta.env.VITE_SHOW_COMING_SOON === 'true';

  // Show Coming Soon page if flag is enabled
  if (showComingSoon) {
    return (
      <BrowserRouter>
        <ComingSoon />
      </BrowserRouter>
    );
  }

  console.log('App component rendering with full routing');

  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="app" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="add-vehicle" element={
              <ProtectedRoute>
                <AddVehicle />
              </ProtectedRoute>
            } />
            <Route path="edit-vehicle/:vin" element={
              <ProtectedRoute>
                <EditVehicle />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="timeline" element={
              <ProtectedRoute>
                <TimelineDashboard />
              </ProtectedRoute>
            } />
            <Route path="upcoming" element={
              <ProtectedRoute>
                <UpcomingTasks />
              </ProtectedRoute>
            } />
          </Route>

          {/* Development route - remove in production */}
          <Route path="/dev-seed" element={<DevSeed />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;