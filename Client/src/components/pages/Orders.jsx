/**
 * User Active Orders Page
 * Shows orders that are pending through out_for_delivery
 * Updates in real-time when provider changes status
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  MapPin, 
  Phone, 
  ChevronRight, 
  Package, 
  RefreshCw,
  History 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import { useTranslation } from 'react-i18next';
import { 
  getUserActiveOrders, 
  subscribeToUserOrders,
  ACTIVE_STATUSES,
  PAST_STATUSES,
  STATUS_LABELS,
  ORDER_STATUSES
} from '@/services/api/orders.service';
import { formatPrice } from '@/utils/formatters';

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
    case ORDER_STATUSES.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case ORDER_STATUSES.CONFIRMED:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case ORDER_STATUSES.PREPARING:
    case ORDER_STATUSES.UNDER_PREPARATION:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case ORDER_STATUSES.READY:
      return 'bg-green-100 text-green-800 border-green-200';
    case ORDER_STATUSES.OUT_FOR_DELIVERY:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Order Card Component
const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
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
              Order #{order.id?.substring(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} border`}>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>

        {/* Order details */}
        <div className="p-4 space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatOrderDate(order.created_at)}</span>
          </div>

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

          {/* Provider Phone */}
          {order.provider_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <a href={`tel:${order.provider_phone}`} className="hover:text-green-600">
                {order.provider_phone}
              </a>
            </div>
          )}

          {/* Items Summary */}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 py-2"
          >
            <span className="font-medium">
              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
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
            <span className="font-medium text-gray-700">Total</span>
            <span className="text-xl font-bold text-green-600">
              {formatPrice(order.total_amount)}
            </span>
          </div>
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
        <Skeleton className="h-6 w-20 rounded-full" />
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
const EmptyState = () => {
  const { t } = useTranslation();
  return (
  <div className="text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <Package className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('orders.noActiveOrders')}</h3>
    <p className="text-gray-500 mb-6">
      {t('orders.noOrdersInProgress')}
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/meals">
        <Button className="bg-green-600 hover:bg-green-700">
          {t('meals.browseMeals')}
        </Button>
      </Link>
      <Link to="/past-orders">
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          {t('orders.viewPastOrders')}
        </Button>
      </Link>
    </div>
  </div>
);};

export default function Orders() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch active orders
  const fetchOrders = useCallback(async (showRefreshing = false) => {
    if (!user?.id) return;

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error: fetchError } = await getUserActiveOrders(user.id);
      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToUserOrders(
      user.id,
      // On new order inserted
      (newOrder) => {
        if (ACTIVE_STATUSES.includes(newOrder.status)) {
          // Refetch to get full order data with joins
          fetchOrders(true);
        }
      },
      // On order updated
      (updatedOrder, oldOrder) => {
        // Check if order moved to past statuses
        if (PAST_STATUSES.includes(updatedOrder.status)) {
          // Remove from active orders
          setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
        } else if (ACTIVE_STATUSES.includes(updatedOrder.status)) {
          // Update the order in place
          setOrders(prev => prev.map(o => 
            o.id === updatedOrder.id 
              ? { ...o, status: updatedOrder.status, updated_at: updatedOrder.updated_at }
              : o
          ));
        }
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, fetchOrders]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('orders.yourOrders')}</h1>
            <p className="text-gray-500 mt-1">
              {t('orders.trackInRealTime')}
            </p>
          </div>
          <div className="flex gap-2">
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
            <Link to="/past-orders">
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                {t('orders.pastOrders')}
              </Button>
            </Link>
          </div>
        </div>

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
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {/* Order Count */}
        {!loading && orders.length > 0 && (
          <p className="text-center text-sm text-gray-500">
            {t('orders.showingActiveOrders', { count: orders.length })}
          </p>
        )}
      </div>
    </Layout>
  );
}
