/**
 * usePlanGate Hook
 * Provides plan-based access control for PRO features
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectProfile } from '@/store/selectors';
import { USER_PLANS, PRO_ROUTES } from '@/config/constants';

/**
 * Hook to check if user has required plan
 * @param {string} requiredPlan - The plan required (default: 'PRO')
 * @returns {object} - { hasPlan, userPlan, isPro, isBasic, canAccess }
 */
export const usePlanGate = (requiredPlan = USER_PLANS.PRO) => {
  const profile = useSelector(selectProfile);
  
  const planInfo = useMemo(() => {
    const userPlan = profile?.plan || USER_PLANS.BASIC;
    const isPro = userPlan === USER_PLANS.PRO;
    const isBasic = userPlan === USER_PLANS.BASIC;
    
    // Check if user has the required plan
    const hasPlan = requiredPlan === USER_PLANS.BASIC 
      ? true // Everyone has at least BASIC
      : isPro; // PRO required - user must be PRO
    
    return {
      hasPlan,
      userPlan,
      isPro,
      isBasic,
      canAccess: hasPlan,
    };
  }, [profile?.plan, requiredPlan]);
  
  return planInfo;
};

/**
 * Check if a specific route requires PRO plan
 * @param {string} path - Route path to check
 * @returns {boolean} - Whether the route requires PRO
 */
export const isProRoute = (path) => {
  return PRO_ROUTES.some(route => path.startsWith(route));
};

/**
 * Hook to check if current user can access a specific route
 * @param {string} path - Route path to check
 * @returns {object} - { canAccess, requiresPro, userPlan }
 */
export const useRouteAccess = (path) => {
  const { isPro, userPlan } = usePlanGate();
  
  const accessInfo = useMemo(() => {
    const requiresPro = isProRoute(path);
    const canAccess = !requiresPro || isPro;
    
    return {
      canAccess,
      requiresPro,
      userPlan,
    };
  }, [path, isPro, userPlan]);
  
  return accessInfo;
};

export default usePlanGate;
