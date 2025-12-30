/**
 * User Past Orders Page
 * Shows orders that are completed, delivered, or cancelled
 * Includes order history with filters
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  MapPin, 
  ChevronRight, 
  Package, 
  RefreshCw,
  ShoppingBag,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { 
  getUserPastOrders, 
  subscribeToUserOrders,
  PAST_STATUSES,
  STATUS_LABELS,
  ORDER_STATUSES
} from '@/services/api/orders.service';
import { formatPrice } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';

// Format date to Asia/Amman timezone
const formatOrderDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-JO', {
      timeZone: 'Asia/Amman',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(dateString).toLocaleString();
  }
};

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.DELIVERED:
      return 'bg-green-100 text-green-800 border-green-200';
    case ORDER_STATUSES.CANCELLED:
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Status icon
const StatusIcon = ({ status }) => {
  switch (status) {
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.DELIVERED:
      return <CheckCircle className="h-4 w-4" />;
    case ORDER_STATUSES.CANCELLED:
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

// Past Order Card Component
const PastOrderCard = ({ order, t }) => {
  const [expanded, setExpanded] = useState(false);
  const isCancelled = order.status === ORDER_STATUSES.CANCELLED;

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${isCancelled ? 'opacity-80' : ''}`}>
      <CardContent className="p-0">
        {/* Header with provider info */}
        <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
          {order.provider_image ? (
            <img
              src={order.provider_image}
              alt={order.provider_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {order.provider_name}
            </h3>
            <p className="text-sm text-gray-500">
              {t('pastOrders.orderNumber', { id: order.id?.substring(0, 8).toUpperCase() })}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} border flex items-center gap-1`}>
            <StatusIcon status={order.status} />
            {t(`status.order.${order.status}`)}
          </Badge>
        </div>

        {/* Order details */}
        <div className="p-4 space-y-3">
          {/* Order Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{t('pastOrders.ordered')}: {formatOrderDate(order.created_at)}</span>
          </div>

          {/* Completion/Cancellation Date */}
          {order.updated_at && order.status !== ORDER_STATUSES.CANCELLED && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{t('pastOrders.delivered')}: {formatOrderDate(order.updated_at)}</span>
            </div>
          )}

          {isCancelled && order.cancelled_at && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              <span>{t('pastOrders.cancelled')}: {formatOrderDate(order.cancelled_at)}</span>
            </div>
          )}

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {order.delivery_address.street_address}
                {order.delivery_address.city && `, ${order.delivery_address.city}`}
              </span>
            </div>
          )}

          {/* Cancellation Reason */}
          {isCancelled && order.cancellation_reason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-1">{t('pastOrders.cancellationReason')}:</p>
              <p className="text-sm text-red-700">{order.cancellation_reason}</p>
            </div>
          )}

          {/* Items Summary */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 py-2"
          >
            <span className="font-medium">
              {order.items?.length || 0} {t('common.items')}
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          {expanded && order.items && order.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.meal_name}
                  </span>
                  <span className="text-gray-500">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="font-medium text-gray-700">{t('orders.total')}</span>
            <span className={`text-xl font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-green-600'}`}>
              {formatPrice(order.total_amount)}
            </span>
          </div>

          {/* Reorder button for completed orders */}
          {!isCancelled && order.provider_id && (
            <Link to={`/meals/providers/${order.provider_id}`}>
              <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                <ShoppingBag className="h-4 w-4" />
                {t('pastOrders.orderAgain')}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Loading skeleton
const OrderSkeleton = () => (
  <Card>
    <CardContent className="p-0">
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between pt-3 border-t">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyState = ({ filter, t }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <Package className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pastOrders.noPastOrders')}</h3>
    <p className="text-gray-500 mb-6">
      {filter === 'all' 
        ? t('pastOrders.noPastOrdersAll')
        : filter === 'completed'
        ? t('pastOrders.noPastOrdersCompleted')
        : t('pastOrders.noPastOrdersCancelled')}
    </p>
    <Link to="/meals">
      <Button className="bg-green-600 hover:bg-green-700">
        {t('meals.browseMeals')}
      </Button>
    </Link>
  </div>
);

export default function PastOrders() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'cancelled'

  // Fetch past orders
  const fetchOrders = useCallback(async (showRefreshing = false) => {
    if (!user?.id) return;

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: fetchError } = await getUserPastOrders(user.id);
      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching past orders:', err);
      setError(err.message || 'Failed to load past orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription for new completions
  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToUserOrders(
      user.id,
      null, // No insert handler for past orders
      // On order updated
      (updatedOrder) => {
        // If an order becomes completed/cancelled, add it
        if (PAST_STATUSES.includes(updatedOrder.status)) {
          // Refetch to get full order data
          fetchOrders(true);
        }
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, fetchOrders]);

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'completed') {
      return order.status === ORDER_STATUSES.COMPLETED || order.status === ORDER_STATUSES.DELIVERED;
    }
    if (filter === 'cancelled') {
      return order.status === ORDER_STATUSES.CANCELLED;
    }
    return true;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/orders" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{t('pastOrders.title')}</h1>
            </div>
            <p className="text-gray-500">
              {t('pastOrders.subtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              <Package className="h-4 w-4" />
              {t('common.all')}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('status.order.completed')}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-2">
              <XCircle className="h-4 w-4" />
              {t('status.order.cancelled')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-700">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchOrders()}
                className="mt-2"
              >
                {t('common.tryAgain')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState filter={filter} t={t} />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <PastOrderCard key={order.id} order={order} t={t} />
            ))}
          </div>
        )}

        {/* Order Count */}
        {!loading && filteredOrders.length > 0 && (
          <p className="text-center text-sm text-gray-500">
            {t('pastOrders.showingOrders', { count: filteredOrders.length })}
          </p>
        )}
      </div>
    </Layout>
  );
}
