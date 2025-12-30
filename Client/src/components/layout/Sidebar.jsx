import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { closeSidebar } from "@/store/slices/uiSlice";
import { useAuth } from "@/hooks/useAuthRedux";
import { usePlanGate, isProRoute } from "@/hooks/usePlanGate";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { USER_ROLES, USER_PLANS, ROUTE_LABELS } from "@/config/constants";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import {
  FiHome,
  FiList,
  FiTrendingUp,
  FiBarChart2,
  FiMessageCircle,
  FiShoppingBag,
  FiSettings,
  FiX,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiUser,
  FiShield,
  FiCheckCircle,
  FiGrid,
  FiClock,
  FiLock,
} from "react-icons/fi";

// Menu configurations for different user roles
// PRO-only routes: /tracker, /progress, /coaching
// badgeKey: key to look up in badges object for dynamic badge count
// labelKey: i18n translation key for the label
const menuConfig = {
  [USER_ROLES.USER]: [
    { to: "/home", labelKey: "sidebar.home", icon: <FiHome /> },
    { to: "/meals", labelKey: "sidebar.meals", icon: <FiList /> },
    { to: "/tracker", labelKey: "sidebar.tracker", icon: <FiTrendingUp />, requiresPro: true },
    { to: "/progress", labelKey: "sidebar.progress", icon: <FiBarChart2 />, requiresPro: true },
    { to: "/subscriptions", labelKey: "sidebar.subscriptions", icon: <FiShoppingBag /> },
    { to: "/coaching", labelKey: "sidebar.chatWithCoach", icon: <FiMessageCircle />, requiresPro: true, badgeKey: "unread" },
    { to: "/my-plan", labelKey: "sidebar.myPlan", icon: <FiFileText />, requiresPro: true },
    { to: "/appointments", labelKey: "sidebar.appointments", icon: <FiCalendar />, requiresPro: true },
    { to: "/orders", labelKey: "sidebar.orders", icon: <FiShoppingBag /> },
    { to: "/past-orders", labelKey: "sidebar.pastOrders", icon: <FiClock /> },
    { to: "/settings", labelKey: "sidebar.settings", icon: <FiSettings /> },
  ],
  [USER_ROLES.COACH]: [
    { to: "/coach/dashboard", labelKey: "sidebar.dashboard", icon: <FiHome /> },
    { to: "/coach/clients", labelKey: "sidebar.myClients", icon: <FiUsers />, badgeKey: "unread" },
    { to: "/coach/appointments", labelKey: "sidebar.appointments", icon: <FiCalendar /> },
    { to: "/settings", labelKey: "sidebar.settings", icon: <FiSettings /> },
  ],
  [USER_ROLES.MEAL_PROVIDER]: [
    { to: "/provider/dashboard", labelKey: "sidebar.dashboard", icon: <FiHome /> },
    { to: "/provider/profile", labelKey: "sidebar.profile", icon: <FiUser /> },
    { to: "/provider/meals", labelKey: "sidebar.myMeals", icon: <FiPackage /> },
    { to: "/provider/orders", labelKey: "sidebar.orders", icon: <FiShoppingBag /> },
    { to: "/settings", labelKey: "sidebar.settings", icon: <FiSettings /> },
  ],
  [USER_ROLES.ADMIN]: [
    { to: "/admin/dashboard", labelKey: "sidebar.adminDashboard", icon: <FiShield /> },
    { to: "/admin/providers", labelKey: "sidebar.providers", icon: <FiUsers /> },
    { to: "/admin/meals", labelKey: "sidebar.meals", icon: <FiPackage /> },
    { to: "/admin/orders", labelKey: "sidebar.orders", icon: <FiShoppingBag /> },
    { to: "/admin/users", labelKey: "sidebar.users", icon: <FiUser /> },
    { divider: true, labelKey: "sidebar.userViews" },
    { to: "/home", labelKey: "sidebar.userHome", icon: <FiHome /> },
    { to: "/meals", labelKey: "sidebar.browseMeals", icon: <FiList /> },
    { to: "/provider/dashboard", labelKey: "sidebar.providerView", icon: <FiGrid /> },
    { to: "/settings", labelKey: "sidebar.settings", icon: <FiSettings /> },
  ],
};

// Get menu items based on user role and plan
const getMenuForRole = (role, isPro) => {
  const baseMenu = menuConfig[role] || menuConfig[USER_ROLES.USER];
  
  // Filter out PRO-only items for BASIC users
  if (!isPro && role === USER_ROLES.USER) {
    return baseMenu.filter(item => !item.requiresPro);
  }
  
  return baseMenu;
};

export default function Sidebar() {
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const dispatch = useDispatch();
  const { user, profile, role, signOut } = useAuth();
  const { isPro, userPlan } = usePlanGate();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  // Create badges object for dynamic badge display
  const badges = {
    unread: unreadCount,
  };

  // Get role-specific menu (filtered by plan)
  const menu = getMenuForRole(role, isPro);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* Overlay for mobile/tablet - locks body scroll when open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      {/* Sidebar - drawer on mobile, always visible on desktop */}
      <div
        className={`fixed ${isRTL ? 'right-0 border-l border-border' : 'left-0 border-r border-border'} top-0 h-screen bg-card shadow-xl flex flex-col z-50 transition-all duration-300 ease-in-out w-64 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="p-6 text-2xl font-bold border-b border-border flex items-center justify-between flex-shrink-0">
          <span className="text-foreground">
            Yami<span className="text-primary">Fit</span>
          </span>
          <button
            onClick={() => dispatch(closeSidebar())}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <FiX className="text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {menu.map((item, index) => {
            // Handle dividers
            if (item.divider) {
              return (
                <div key={`divider-${index}`} className="px-6 py-3">
                  <div className="border-t border-border" />
                  {item.labelKey && (
                    <p className="text-xs text-muted-foreground uppercase mt-3 font-medium">
                      {t(item.labelKey)}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() =>
                  window.innerWidth < 1024 && dispatch(closeSidebar())
                }
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all relative ${
                    isActive
                      ? `bg-primary/10 text-primary font-semibold after:absolute ${isRTL ? 'after:right-0' : 'after:left-0'} after:top-0 after:bottom-0 after:w-1 after:bg-primary`
                      : ""
                  }`
                }
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="flex-1 text-start">{t(item.labelKey)}</span>
                {/* PRO badge for restricted items */}
                {item.requiresPro && !isPro && (
                  <span className="text-xs bg-info/10 text-info px-1.5 py-0.5 rounded font-medium">
                    {t('sidebar.proOnly')}
                  </span>
                )}
                {/* Unread badge */}
                {item.badgeKey && badges[item.badgeKey] > 0 && (
                  <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-destructive-foreground bg-destructive rounded-full">
                    {badges[item.badgeKey] > 99 ? '99+' : badges[item.badgeKey]}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border bg-muted flex-shrink-0">
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground mb-1 truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {role && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                  {role === USER_ROLES.MEAL_PROVIDER ? t('sidebar.providers') : role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              )}
              {role === USER_ROLES.USER && (
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  isPro 
                    ? 'bg-info/10 text-info' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {userPlan}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors font-medium"
          >
            {t('sidebar.logout')}
          </button>
        </div>
      </div>
    </>
  );
}
