/**
 * PlanRoute Component
 * Wrapper component for routes that require specific subscription plan
 * Redirects BASIC users to upgrade page for PRO-only routes
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthRedux";
import { usePlanGate } from "@/hooks/usePlanGate";
import { ROUTES, USER_PLANS } from "@/config/constants";

/**
 * PlanRoute - Requires specific plan to access
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if plan matches
 * @param {string} props.requiredPlan - Plan required to access this route (default: 'PRO')
 * @returns {React.ReactNode} - Rendered component or redirect to upgrade page
 */
export const PlanRoute = ({ children, requiredPlan = USER_PLANS.PRO }) => {
  const { isAuthenticated, loading } = useAuth();
  const { hasPlan, userPlan } = usePlanGate(requiredPlan);
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

  // Check if user has required plan
  if (!hasPlan) {
    // Redirect to upgrade page with return URL
    return (
      <Navigate 
        to={ROUTES.UPGRADE} 
        state={{ 
          from: location,
          requiredPlan,
          currentPlan: userPlan 
        }} 
        replace 
      />
    );
  }

  // Render children if plan matches
  return children;
};

export default PlanRoute;
