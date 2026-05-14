import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/AuthContext';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, loading, supportAccess, supportAccessLoading } = useAuth();
  const location = useLocation();

  if (loading || supportAccessLoading) return null;

  if (!user || user.isAnonymous || !supportAccess?.isSuperAdmin) {
    const to = `/app?denied=super-admin&redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}

SuperAdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
