/**
 * Admin Dashboard Page
 * Overview of system statistics and recent activity
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Layout from "../layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { getDashboardStats, getRecentActivityLogs, getAllProviders, getAllOrders } from "@/services/api/admin.service";
import { formatPrice, formatDate } from "@/utils/formatters";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const result = await getDashboardStats();
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch recent activity
  const { 
    data: activityLogs, 
    isLoading: activityLoading 
  } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const result = await getRecentActivityLogs(5);
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch pending providers (unverified)
  const { 
    data: pendingProviders 
  } = useQuery({
    queryKey: ["admin-pending-providers"],
    queryFn: async () => {
      const result = await getAllProviders({ verified: "false", limit: 5 });
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch recent orders
  const { 
    data: recentOrders 
  } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const result = await getAllOrders({ limit: 5 });
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 30 * 1000,
  });

  if (statsLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t("adminDashboard.loading")} />
      </Layout>
    );
  }

  if (statsError) {
    return (
      <Layout>
        <ErrorMessage
          title={t("adminDashboard.loadError")}
          message={statsError?.message || t("common.error")}
        />
      </Layout>
    );
  }

  const statCards = [
    {
      title: t("adminDashboard.totalProviders"),
      value: stats?.total_providers || 0,
      description: t("adminDashboard.verifiedCount", { count: stats?.verified_providers || 0 }),
      icon: Users,
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-50",
      onClick: () => navigate("/admin/providers"),
    },
    {
      title: t("adminDashboard.totalMeals"),
      value: stats?.total_meals || 0,
      description: t("adminDashboard.availableCount", { count: stats?.available_meals || 0 }),
      icon: Package,
      iconColor: "text-green-600",
      iconBgColor: "bg-green-50",
      onClick: () => navigate("/admin/meals"),
    },
    {
      title: t("adminDashboard.totalOrders"),
      value: stats?.total_orders || 0,
      description: t("adminDashboard.pendingCount", { count: stats?.pending_orders || 0 }),
      icon: ShoppingBag,
      iconColor: "text-orange-600",
      iconBgColor: "bg-orange-50",
      onClick: () => navigate("/admin/orders"),
    },
    {
      title: t("adminDashboard.totalRevenue"),
      value: formatPrice(stats?.total_revenue || 0),
      description: t("adminDashboard.allTime"),
      icon: DollarSign,
      iconColor: "text-purple-600",
      iconBgColor: "bg-purple-50",
    },
  ];

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      under_preparation: "bg-orange-100 text-orange-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getActionLabel = (action) => {
    const labels = {
      verify_provider: t("adminDashboard.actions.verifyProvider"),
      unverify_provider: t("adminDashboard.actions.unverifyProvider"),
      activate_provider: t("adminDashboard.actions.activateProvider"),
      deactivate_provider: t("adminDashboard.actions.deactivateProvider"),
      disable_provider: t("adminDashboard.actions.disableProvider"),
      enable_provider: t("adminDashboard.actions.enableProvider"),
      update_provider: t("adminDashboard.actions.updateProvider"),
      update_meal: t("adminDashboard.actions.updateMeal"),
      enable_meal: t("adminDashboard.actions.enableMeal"),
      disable_meal: t("adminDashboard.actions.disableMeal"),
      delete_meal: t("adminDashboard.actions.deleteMeal"),
      force_cancel_order: t("adminDashboard.actions.forceCancelOrder"),
      update_order_status: t("adminDashboard.actions.updateOrderStatus"),
    };
    return labels[action] || action;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("adminDashboard.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("adminDashboard.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/providers")}>
              <Users className="h-4 w-4 me-2" />
              {t("adminDashboard.manageProviders")}
            </Button>
            <Button onClick={() => navigate("/admin/orders")}>
              <ShoppingBag className="h-4 w-4 me-2" />
              {t("adminDashboard.viewOrders")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card 
              key={index} 
              className={stat.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
              onClick={stat.onClick}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.iconBgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts / Quick Actions */}
        {(stats?.pending_orders > 0 || pendingProviders?.length > 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">{t("adminDashboard.attentionRequired")}</p>
                  <div className="text-sm text-yellow-700 mt-1 space-x-4 rtl:space-x-reverse">
                    {stats?.pending_orders > 0 && (
                      <span>{t("adminDashboard.ordersPendingReview", { count: stats.pending_orders })}</span>
                    )}
                    {pendingProviders?.length > 0 && (
                      <span>{t("adminDashboard.providersAwaitingVerification", { count: pendingProviders.length })}</span>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => navigate("/admin/providers?filter=unverified")}
                >
                  {t("adminDashboard.review")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                {t("adminDashboard.pendingVerification")}
              </CardTitle>
              <CardDescription>{t("adminDashboard.providersAwaitingVerificationDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingProviders?.length > 0 ? (
                <div className="space-y-3">
                  {pendingProviders.map((provider) => (
                    <div 
                      key={provider.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/providers/${provider.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {provider.profile_image_url ? (
                            <img 
                              src={provider.profile_image_url} 
                              alt={provider.business_name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{provider.business_name || provider.provider_name || t("adminDashboard.unnamedProvider")}</p>
                          <p className="text-xs text-muted-foreground">{provider.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(provider.created_at)}
                      </span>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2" 
                    onClick={() => navigate("/admin/providers?filter=unverified")}
                  >
                    {t("adminDashboard.viewAllPending")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-sm text-muted-foreground">{t("adminDashboard.allProvidersVerified")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-500" />
                {t("adminDashboard.recentOrders")}
              </CardTitle>
              <CardDescription>{t("adminDashboard.latestOrdersDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders?.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/orders?id=${order.id}`)}
                    >
                      <div>
                        <p className="font-medium text-sm">{order.customer_name || t("adminDashboard.guest")}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items_count} items · {formatPrice(order.total_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2" 
                    onClick={() => navigate("/admin/orders")}
                  >
                    {t("adminDashboard.viewAllOrders")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-muted-foreground">{t("adminDashboard.noOrdersYet")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              {t("adminDashboard.recentActivity")}
            </CardTitle>
            <CardDescription>{t("adminDashboard.recentActivityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activityLogs?.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getActionLabel(log.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          by {log.profiles?.full_name || log.profiles?.email || "Admin"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(log.created_at)}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-gray-500 max-w-[150px] truncate">
                          {log.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-muted-foreground">{t("adminDashboard.noActivityYet")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
