import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import AppOfflineNotice from './AppOfflineNotice';
import { useAuth } from '../shared/AuthContext';
import { useAppOffline } from '../shared/useAppOffline';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAppOffline = useAppOffline();

  if (loading) return null; // or a spinner

  // Blocks a direct link/bookmark to a protected page from bypassing the
  // disabled sign-in/sign-up entry points elsewhere in the marketing site --
  // an existing session shouldn't reach the app either during a pre-launch
  // window or a maintenance outage (see useAppOffline).
  if (isAppOffline) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-5 py-6">
        <AppOfflineNotice />
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    const to = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={to} replace />;
  }
  return <>{children}</>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
