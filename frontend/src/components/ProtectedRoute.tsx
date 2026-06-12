import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { UserRole } from '@/types';

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useUserStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
