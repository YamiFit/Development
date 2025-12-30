/**
 * Service Provider Dashboard Component
 * Main dashboard for meal providers to manage meals and orders
 * Redesigned for better UX, visual hierarchy, and full responsiveness
 * MOBILE-FIRST: No horizontal overflow, proper card layouts, responsive grids
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../layout/Layout";
import PageHeader from "../shared/PageHeader";
import ResponsiveCard from "../shared/ResponsiveCard";
import LoadingSkeleton, { StatsCardSkeleton, OrderCardSkeleton } from "../shared/LoadingSkeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  ImageIcon,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { useProviderInit } from "@/hooks/useProviderInit";
import { formatPrice } from "@/utils/formatters";
import {
  getProviderRecentOrders,
  getProviderPopularMeals,
  subscribeToProviderOrders,
  STATUS_LABELS,
  ORDER_STATUSES,
} from "@/services/api/orders.service";

// Format date to Asia/Amman timezone
const formatOrderDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString("en-JO", {
      timeZone: "Asia/Amman",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(dateString).toLocaleString();
  }
};

// Get time-based greeting key
const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "providerDashboard.goodMorning";
  if (hour < 18) return "providerDashboard.goodAfternoon";
  return "providerDashboard.goodEvening";
};

// Status color mapping - using system palette
const getStatusColor = (status) => {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case ORDER_STATUSES.CONFIRMED:
    case ORDER_STATUSES.PREPARING:
    case ORDER_STATUSES.UNDER_PREPARATION:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case ORDER_STATUSES.READY:
      return "bg-green-100 text-green-800 border-green-200";
    case ORDER_STATUSES.OUT_FOR_DELIVERY:
      return "bg-purple-100 text-purple-800 border-purple-200";
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.DELIVERED:
      return "bg-green-100 text-green-800 border-green-200";
    case ORDER_STATUSES.CANCELLED:
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Enhanced Stats Card Component - Fully Responsive
const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor,
  iconBgColor,
}) => (
  <Card className="w-full min-w-0 overflow-hidden hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 break-words">
            {value}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-lg ${iconBgColor} flex-shrink-0`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t flex items-center gap-1 text-xs">
          <ArrowUpRight className="h-3 w-3 text-green-600 flex-shrink-0" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-muted-foreground truncate">vs last month</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// Recent Orders Widget Component
const RecentOrdersWidget = ({ providerId }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRecentOrders = useCallback(async () => {
    if (!providerId) return;

    try {
      const { data, error } = await getProviderRecentOrders(providerId, 5);
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching recent orders:", err);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchRecentOrders();
  }, [fetchRecentOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!providerId) return;

    const channel = subscribeToProviderOrders(
      providerId,
      // On new order
      () => fetchRecentOrders(),
      // On order update
      () => fetchRecentOrders()
    );

    return () => {
      channel.unsubscribe();
    };
  }, [providerId, fetchRecentOrders]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 mb-1">{t("providerDashboard.noOrdersYet")}</p>
          <p className="text-sm text-muted-foreground">
            {t("providerDashboard.newOrdersAppearHere")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="w-full min-w-0 flex items-center gap-3 p-3 border rounded-lg hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all duration-200 group"
          onClick={() => navigate("/provider/orders")}
        >
          {order.customer_avatar ? (
            <img
              src={order.customer_avatar}
              alt={order.customer_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-offset-2 ring-transparent group-hover:ring-green-200 transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 ring-2 ring-offset-2 ring-transparent group-hover:ring-green-200 transition-all">
              <span className="text-green-700 font-semibold text-sm">
                {order.customer_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-gray-900">
              {order.customer_name}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {formatOrderDate(order.created_at)}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <Badge
              className={`${getStatusColor(order.status)} text-xs border mb-1 whitespace-nowrap`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </Badge>
            {order.total_amount && (
              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                {formatPrice(order.total_amount)}
              </p>
            )}
          </div>
        </div>
      ))}
      <Link to="/provider/orders" className="block">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
        >
          {t("providerDashboard.viewAllOrders")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
};

// Popular Meals Widget Component
const PopularMealsWidget = ({ providerId }) => {
  const { t } = useTranslation();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPopularMeals = async () => {
      if (!providerId) return;

      try {
        const { data, error } = await getProviderPopularMeals(providerId, 5);
        if (error) throw error;
        setMeals(data || []);
      } catch (err) {
        console.error("Error fetching popular meals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularMeals();
  }, [providerId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 border rounded-lg"
          >
            <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-12 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900 mb-1">{t("providerDashboard.noSalesDataYet")}</p>
          <p className="text-sm text-muted-foreground">
            {t("providerDashboard.popularMealsAppearHere")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal, index) => (
        <div
          key={meal.meal_id}
          className="w-full min-w-0 flex items-center gap-3 p-3 border rounded-lg hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all duration-200 group"
          onClick={() => navigate("/provider/meals")}
        >
          <div className="relative flex-shrink-0">
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold z-10 shadow-sm">
              {index + 1}
            </span>
            {meal.meal_image_url ? (
              <img
                src={meal.meal_image_url}
                alt={meal.meal_name}
                className="w-12 h-12 rounded-lg object-cover ring-2 ring-offset-2 ring-transparent group-hover:ring-green-200 transition-all"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ring-2 ring-offset-2 ring-transparent group-hover:ring-green-200 transition-all">
                <ImageIcon className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-gray-900">
              {meal.meal_name}
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatPrice(meal.meal_price)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-green-600">
              {meal.total_sold}
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{t("providerDashboard.sold")}</p>
          </div>
        </div>
      ))}
      <Link to="/provider/meals" className="block">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
        >
          {t("providerDashboard.manageMeals")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
};

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { provider, stats: providerStats, loading, error } = useProviderInit();

  // Handle loading state
  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message={t("providerDashboard.loadingDashboard")} />
      </Layout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Layout>
        <ErrorMessage title={t("providerDashboard.failedToLoad")} message={error} />
      </Layout>
    );
  }

  // Check if profile is incomplete
  const isProfileIncomplete = provider && !provider.business_name;

  // Stats data with real values
  const stats = [
    {
      title: t("providerDashboard.totalMeals"),
      value: providerStats.totalMeals || 0,
      description: t("providerDashboard.activeMealOfferings"),
      icon: Package,
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-50",
    },
    {
      title: t("providerDashboard.activeOrders"),
      value: providerStats.activeOrders || 0,
      description: t("providerDashboard.awaitingFulfillment"),
      icon: ShoppingCart,
      iconColor: "text-orange-600",
      iconBgColor: "bg-orange-50",
    },
    {
      title: t("providerDashboard.monthlyRevenue"),
      value: formatPrice(providerStats.monthlyRevenue || 0),
      description: t("providerDashboard.thisMonthEarnings"),
      icon: DollarSign,
      iconColor: "text-green-600",
      iconBgColor: "bg-green-50",
    },
    {
      title: t("providerDashboard.growth"),
      value: `${providerStats.growth || 0}%`,
      description: t("providerDashboard.vsLastMonth"),
      icon: TrendingUp,
      iconColor: "text-purple-600",
      iconBgColor: "bg-purple-50",
    },
  ];

  // Quick Actions data
  const quickActions = [
    {
      icon: Plus,
      title: t("providerDashboard.addMeal"),
      description: t("providerDashboard.createNewOffering"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      onClick: () => navigate("/provider/meals"),
    },
    {
      icon: ShoppingCart,
      title: t("providerDashboard.viewOrders"),
      description: t("providerDashboard.manageOrders"),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverColor: "hover:bg-orange-100",
      onClick: () => navigate("/provider/orders"),
    },
    {
      icon: DollarSign,
      title: t("providerDashboard.revenue"),
      description: t("providerDashboard.viewAnalytics"),
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      onClick: () => navigate("/provider/revenue"),
    },
    {
      icon: TrendingUp,
      title: t("providerDashboard.analytics"),
      description: t("providerDashboard.businessInsights"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
      onClick: () => navigate("/provider/analytics"),
    },
  ];

  return (
    <Layout>
      <div className="w-full min-w-0 space-y-6 pb-8">
        {/* Header with Welcome Message */}
        <div className="w-full min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{t(getGreetingKey())}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 break-words">
            {provider?.business_name || t("providerDashboard.dashboard")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl break-words">
            {t("providerDashboard.trackPerformance")}
          </p>
        </div>

        {/* Profile Incomplete Alert */}
        {isProfileIncomplete && (
          <Card className="w-full min-w-0 border-yellow-200 bg-yellow-50 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-yellow-100 flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-yellow-900 mb-1 break-words">
                      {t("providerDashboard.completeYourProfile")}
                    </p>
                    <p className="text-sm text-yellow-800 break-words">
                      {t("providerDashboard.setupBusinessInfo")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/provider/profile?setup=true")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto flex-shrink-0 shadow-sm"
                  size="sm"
                >
                  {t("providerDashboard.completeNow")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content - Recent Orders & Popular Meals */}
        <div className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <Card className="w-full min-w-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg font-semibold truncate">
                    {t("providerDashboard.recentOrders")}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 truncate">
                    {t("providerDashboard.latestCustomerActivity")}
                  </CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-orange-50 flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <RecentOrdersWidget providerId={provider?.id} />
            </CardContent>
          </Card>

          {/* Popular Meals */}
          <Card className="w-full min-w-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg font-semibold truncate">
                    {t("providerDashboard.popularMeals")}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 truncate">
                    {t("providerDashboard.topSellingItems")}
                  </CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-green-50 flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <PopularMealsWidget providerId={provider?.id} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Enhanced - Responsive: 2 cols mobile, 4 cols desktop */}
        <Card className="w-full min-w-0 shadow-sm">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t("providerDashboard.quickActions")}
            </CardTitle>
            <CardDescription className="text-sm mt-1 break-words">
              {t("providerDashboard.accessCommonTasks")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="w-full min-w-0 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={action.onClick}
                  className="h-auto p-3 sm:p-4 flex flex-col items-start gap-2 sm:gap-3 hover:border-green-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div
                    className={`p-2 sm:p-2.5 rounded-lg ${action.bgColor} ${action.hoverColor} transition-colors flex-shrink-0`}
                  >
                    <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color}`} />
                  </div>
                  <div className="text-left w-full min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-0.5 truncate">
                      {action.title}
                    </h4>
                    <p className="text-xs text-muted-foreground break-words line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProviderDashboard;
