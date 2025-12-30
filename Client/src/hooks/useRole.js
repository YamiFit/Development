/**
 * useRole Hook
 * Custom hook for role-based utilities and permission checks
 */

import { useAuth } from './useAuthRedux';
import { USER_ROLES, ROLE_PERMISSIONS, ROLE_DASHBOARD_ROUTES } from '@/config/constants';

/**
 * Custom hook for role-based utilities
 * @returns {Object} Role utilities and permissions
 */
export const useRole = () => {
  const { role, isAdmin, isCoach, isMealProvider, isUser } = useAuth();

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission key to check
   * @returns {boolean} Whether user has the permission
   */
  const hasPermission = (permission) => {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    return permissions ? permissions[permission] === true : false;
  };

  /**
   * Check if user has one of the allowed roles
   * @param {string[]} allowedRoles - Array of allowed roles
   * @returns {boolean} Whether user has one of the allowed roles
   */
  const hasRole = (allowedRoles) => {
    return role && allowedRoles.includes(role);
  };

  /**
   * Get the default dashboard route for the user's role
   * @returns {string} Dashboard route path
   */
  const getDashboardRoute = () => {
    return role ? ROLE_DASHBOARD_ROUTES[role] : '/home';
  };

  /**
   * Get human-readable role name
   * @returns {string} Formatted role name
   */
  const getRoleName = () => {
    if (!role) return 'Guest';

    switch (role) {
      case USER_ROLES.USER:
        return 'User';
      case USER_ROLES.COACH:
        return 'Coach';
      case USER_ROLES.MEAL_PROVIDER:
        return 'Service Provider';
      case USER_ROLES.ADMIN:
        return 'Admin';
      default:
        return 'User';
    }
  };

  /**
   * Check if user can access user dashboard
   * @returns {boolean}
   */
  const canAccessUserDashboard = () => {
    return hasPermission('canAccessUserDashboard');
  };

  /**
   * Check if user can access coach dashboard
   * @returns {boolean}
   */
  const canAccessCoachDashboard = () => {
    return hasPermission('canAccessCoachDashboard');
  };

  /**
   * Check if user can access provider dashboard
   * @returns {boolean}
   */
  const canAccessProviderDashboard = () => {
    return hasPermission('canAccessProviderDashboard');
  };

  return {
    // Role state
    role,
    roleName: getRoleName(),

    // Role checks
    isAdmin,
    isCoach,
    isMealProvider,
    isUser,

    // Utility functions
    hasPermission,
    hasRole,
    getDashboardRoute,

    // Specific permission checks
    canAccessUserDashboard: canAccessUserDashboard(),
    canAccessCoachDashboard: canAccessCoachDashboard(),
    canAccessProviderDashboard: canAccessProviderDashboard(),
  };
};

export default useRole;
