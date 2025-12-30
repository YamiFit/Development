/**
 * RoleRoute Component
 * Wrapper component for routes that require specific roles
 * Redirects based on role permissions
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthRedux";
import { ROUTES, ROLE_DASHBOARD_ROUTES } from "@/config/constants";

/**
 * RoleRoute - Requires specific role(s) to access
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if role matches
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 * @returns {React.ReactNode} - Rendered component or redirect
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasRequiredRole = role && allowedRoles.includes(role);

  if (!hasRequiredRole) {
    // Redirect to appropriate dashboard based on user's role
    const redirectPath = role
      ? ROLE_DASHBOARD_ROUTES[role] || ROUTES.HOME
      : ROUTES.HOME;
    console.log("🎭 RoleRoute: Role not allowed, redirecting to", redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if role matches
  return children;
};

export default RoleRoute;
