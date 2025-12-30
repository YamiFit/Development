import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { Provider } from "react-redux";
import { store } from "@/store";
import { USER_ROLES } from "@/config/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Public pages
import LandingPage from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// User dashboard pages
import DashboardHome from "@/components/pages/Home";
import Meals from "@/components/pages/Meals";
import MealProviderDetailsPage from "@/components/pages/MealProviderDetailsPage";
import TrackerPro from "@/components/pages/TrackerPro";
import CoachDetailsPage from "@/components/pages/CoachDetailsPage";
import ChattingProgress from "@/components/pages/ChattingProgress";
import ChattingCoaching from "@/components/pages/ChattingCoaching";
import Subscriptions from "@/components/pages/Subscriptions";
import Orders from "@/components/pages/Orders";
import PastOrders from "@/components/pages/PastOrders";
import Settings from "@/components/pages/Settings";
import Upgrade from "@/components/pages/Upgrade";

// Notifications page
import NotificationsPage from "@/pages/Notifications";

// Coach dashboard pages
import CoachDashboard from "@/components/pages/CoachDashboard";
import CoachProfile from "@/components/pages/CoachProfile";
import CoachMyClients from "@/components/pages/CoachMyClients";
import CoachClientDetail from "@/components/pages/CoachClientDetail";
import CoachClientChat from "@/components/pages/CoachClientChat";
import DietAppliance from "@/components/pages/DietAppliance";
import CoachAppointments from "@/components/pages/CoachAppointments";

// User coaching pages
import UserCoachingChat from "@/components/pages/UserCoachingChat";
import UserMyPlan from "@/components/pages/UserMyPlan";
import UserAppointments from "@/components/pages/UserAppointments";

// Provider dashboard pages
import ProviderDashboard from "@/components/pages/ProviderDashboard";
import ProviderProfile from "@/components/pages/ProviderProfile";
import ProviderMeals from "@/components/pages/ProviderMeals";
import ProviderOrders from "@/components/pages/ProviderOrders";

// Admin dashboard pages
import AdminDashboard from "@/components/pages/AdminDashboard";
import AdminProviders from "@/components/pages/AdminProviders";
import AdminProviderDetails from "@/components/pages/AdminProviderDetails";
import AdminMeals from "@/components/pages/AdminMeals";
import AdminOrders from "@/components/pages/AdminOrders";
import AdminUsers from "@/components/pages/AdminUsers";

// Route protection components
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import PlanRoute from "@/components/PlanRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<LoadingFallback />}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <Provider store={store}>
              <ThemeProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* User dashboard routes - Protected */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <DashboardHome />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meals"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <Meals />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/meals/providers/:providerId"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <MealProviderDetailsPage />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />

                {/* PRO-only routes */}
                <Route
                  path="/tracker"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PlanRoute>
                          <TrackerPro />
                        </PlanRoute>
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tracker/coach/:coachId"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PlanRoute>
                          <CoachDetailsPage />
                        </PlanRoute>
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PlanRoute>
                          <ChattingProgress />
                        </PlanRoute>
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coaching"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PlanRoute>
                          <UserCoachingChat />
                        </PlanRoute>
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-plan"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PlanRoute>
                          <UserMyPlan />
                        </PlanRoute>
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PlanRoute>
                          <UserAppointments />
                        </PlanRoute>
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/upgrade"
                  element={
                    <ProtectedRoute>
                      <Upgrade />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/subscriptions"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <Subscriptions />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <Orders />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/past-orders"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}
                      >
                        <PastOrders />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Coach dashboard routes - Protected */}
                <Route
                  path="/coach/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachDashboard />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/profile"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachProfile />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/clients"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachMyClients />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/clients/:clientId"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachClientDetail />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/clients/:clientId/chat"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachClientChat />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/clients/:clientId/plan"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <DietAppliance />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/clients/:clientId/plan/:planId"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <DietAppliance />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/clients/:clientId/appointments"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachAppointments />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coach/appointments"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[USER_ROLES.COACH, USER_ROLES.ADMIN]}
                      >
                        <CoachAppointments />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Provider dashboard routes - Protected */}
                <Route
                  path="/provider/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[
                          USER_ROLES.MEAL_PROVIDER,
                          USER_ROLES.ADMIN,
                        ]}
                      >
                        <ProviderDashboard />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/profile"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[
                          USER_ROLES.MEAL_PROVIDER,
                          USER_ROLES.ADMIN,
                        ]}
                      >
                        <ProviderProfile />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/meals"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[
                          USER_ROLES.MEAL_PROVIDER,
                          USER_ROLES.ADMIN,
                        ]}
                      >
                        <ProviderMeals />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/provider/orders"
                  element={
                    <ProtectedRoute>
                      <RoleRoute
                        allowedRoles={[
                          USER_ROLES.MEAL_PROVIDER,
                          USER_ROLES.ADMIN,
                        ]}
                      >
                        <ProviderOrders />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Admin dashboard routes - Protected */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminDashboard />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/providers"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminProviders />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/providers/:providerId"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminProviderDetails />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/meals"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminMeals />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminOrders />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminUsers />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Settings - Accessible to all authenticated users */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications - Accessible to all authenticated users */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
        </Provider>
      </LanguageProvider>
    </QueryClientProvider>
      </Suspense>
    </I18nextProvider>
  );
};

export default App;
