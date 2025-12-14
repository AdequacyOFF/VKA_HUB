import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function RoleProtectedRoute({ children, requireAdmin = false }: RoleProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check for moderator or admin privileges
  const isModerator = user.is_moderator || user.is_admin || user.roles?.includes('moderator') || user.roles?.includes('admin');
  const isAdmin = user.is_admin || user.roles?.includes('admin');

  // If admin is required but user is not admin, deny access
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If user is not a moderator at all, deny access
  if (!isModerator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
