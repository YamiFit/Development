/**
 * ProtectedRoute Component
 * Wrapper component for routes that require authentication
 * Redirects to login if user is not authenticated
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthRedux";
import { ROUTES } from "@/config/constants";

/**
 * ProtectedRoute - Requires authentication to access
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Rendered component or redirect
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
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
    console.log("🛡️ ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
