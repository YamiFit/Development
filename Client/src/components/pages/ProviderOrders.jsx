/**
 * Provider Orders Page
 * View and manage orders with status updates
 * Real-time updates when user places new orders
 * MOBILE-FIRST: Responsive cards, horizontal scrollable filters, proper overflow handling
 */

import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import PageHeader from '../shared/PageHeader';
import LoadingSkeleton, { OrderCardSkeleton } from '../shared/LoadingSkeleton';
import EmptyState from '../shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, Clock, PackageCheck, Truck, RefreshCw, AlertCircle, User, Phone, MapPin, Calendar, ShoppingBag } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import { useProviderInit } from '@/hooks/useProviderInit';
import { useDebounce } from '@/hooks/useDebounce';
import { setOrders, setOrdersLoading, setOrdersError, updateOrderStatus as updateOrderStatusRedux } from '@/store/slices/providerOrdersSlice';
import { selectOrdersList, selectOrdersLoading, selectOrdersError } from '@/store/selectors';
import {
  getProviderOrders,
  updateOrderStatus,
  subscribeToProviderOrders,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  ORDER_STATUSES
} from '@/services/api/orders.service';
import { formatPrice, formatOrderId } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

// Format date to Asia/Amman timezone
const formatOrderDateTime = (dateString) => {
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

// Active order tabs (orders being processed)
const ACTIVE_ORDER_TABS = [
  { value: 'all_active', labelKey: 'providerOrders.allActive', icon: PackageCheck },
  { value: 'pending', labelKey: 'providerOrders.new', icon: Clock },
  { value: 'under_preparation', labelKey: 'providerOrders.preparing', icon: PackageCheck },
  { value: 'ready', labelKey: 'providerOrders.ready', icon: Check },
  { value: 'out_for_delivery', labelKey: 'providerOrders.outForDeliveryTab', icon: Truck },
];

// Past order tabs (completed or cancelled)
const PAST_ORDER_TABS = [
  { value: 'all_past', labelKey: 'providerOrders.allPast', icon: PackageCheck },
  { value: 'completed', labelKey: 'providerOrders.completed', icon: Check },
  { value: 'cancelled', labelKey: 'providerOrders.cancelled', icon: X },
];

// Active statuses for filtering
const PROVIDER_ACTIVE_STATUSES = ['pending', 'confirmed', 'under_preparation', 'preparing', 'ready', 'out_for_delivery'];
const PROVIDER_PAST_STATUSES = ['completed', 'delivered', 'cancelled'];

// Status badge colors
const getStatusBadgeClass = (status) => {
  switch (status) {
    case ORDER_STATUSES.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case ORDER_STATUSES.CONFIRMED:
    case ORDER_STATUSES.PREPARING:
    case ORDER_STATUSES.UNDER_PREPARATION:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case ORDER_STATUSES.READY:
      return 'bg-green-100 text-green-800 border-green-200';
    case ORDER_STATUSES.OUT_FOR_DELIVERY:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.DELIVERED:
      return 'bg-green-100 text-green-800 border-green-200';
    case ORDER_STATUSES.CANCELLED:
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const ProviderOrders = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { provider, loading: providerLoading } = useProviderInit();
  const orders = useSelector(selectOrdersList);
  const ordersLoading = useSelector(selectOrdersLoading);
  const ordersError = useSelector(selectOrdersError);

  const [viewMode, setViewMode] = useState('active'); // 'active' or 'past'
  const [activeTab, setActiveTab] = useState('all_active');
  const [pastTab, setPastTab] = useState('all_past');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusDialog, setStatusDialog] = useState({ open: false, order: null, newStatus: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, order: null, reason: '' });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Determine which status to filter by based on view mode and tab
  const getStatusFilter = useCallback(() => {
    if (viewMode === 'active') {
      if (activeTab === 'all_active') return undefined; // Will filter client-side
      return activeTab;
    } else {
      if (pastTab === 'all_past') return undefined; // Will filter client-side
      return pastTab;
    }
  }, [viewMode, activeTab, pastTab]);

  // Load orders when provider is available or view/tab changes
  const loadOrders = useCallback(async (showRefreshing = false) => {
    if (!provider?.id) return;

    if (showRefreshing) {
      setRefreshing(true);
    } else {
      dispatch(setOrdersLoading(true));
    }

    try {
      const { data, error } = await getProviderOrders(provider.id, {
        status: getStatusFilter(),
      });

      if (error) throw error;

      dispatch(setOrders(data));
    } catch (err) {
      console.error('Error loading orders:', err);
      dispatch(setOrdersError(err.message || 'Failed to load orders'));
    } finally {
      dispatch(setOrdersLoading(false));
      setRefreshing(false);
    }
  }, [provider?.id, getStatusFilter, dispatch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time subscription for provider orders
  useEffect(() => {
    if (!provider?.id) return;

    const channel = subscribeToProviderOrders(
      provider.id,
      // On new order
      () => {
        toast({
          title: t('providerOrders.newOrderAlert'),
          description: t('providerOrders.customerPlacedOrder'),
        });
        loadOrders(true);
      },
      // On order update
      () => {
        // Update the order in place or refetch
        loadOrders(true);
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [provider?.id, loadOrders, toast]);

  // Filter orders by search and view mode
  const filteredOrders = orders.filter(order => {
    // First filter by view mode
    const isActiveOrder = PROVIDER_ACTIVE_STATUSES.includes(order.status);
    const isPastOrder = PROVIDER_PAST_STATUSES.includes(order.status);
    
    if (viewMode === 'active' && !isActiveOrder) return false;
    if (viewMode === 'past' && !isPastOrder) return false;

    // Then filter by specific tab
    if (viewMode === 'active' && activeTab !== 'all_active') {
      if (order.status !== activeTab) return false;
    }
    if (viewMode === 'past' && pastTab !== 'all_past') {
      if (order.status !== pastTab) return false;
    }

    // Finally filter by search
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(search) ||
      order.id?.toLowerCase().includes(search)
    );
  });

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!statusDialog.order || !statusDialog.newStatus) return;

    setUpdatingStatus(true);

    try {
      const { error } = await updateOrderStatus(statusDialog.order.id, {
        status: statusDialog.newStatus,
      });

      if (error) throw error;

      dispatch(updateOrderStatusRedux({ orderId: statusDialog.order.id, status: statusDialog.newStatus }));

      toast({
        title: t('common.success'),
        description: t('providerOrders.statusUpdated'),
      });

      setStatusDialog({ open: false, order: null, newStatus: null });
      loadOrders(); // Refresh orders
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: t('common.error'),
        description: err.message || t('providerOrders.failedToUpdateStatus'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!cancelDialog.order) return;

    setUpdatingStatus(true);

    try {
      const { error } = await updateOrderStatus(cancelDialog.order.id, {
        status: 'cancelled',
        cancellation_reason: cancelDialog.reason,
      });

      if (error) throw error;

      dispatch(updateOrderStatusRedux({ orderId: cancelDialog.order.id, status: 'cancelled' }));

      toast({
        title: t('common.success'),
        description: t('providerOrders.orderCancelled'),
      });

      setCancelDialog({ open: false, order: null, reason: '' });
      loadOrders(); // Refresh orders
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast({
        title: t('common.error'),
        description: err.message || t('providerOrders.failedToCancel'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Status action buttons for each order
  const getStatusActions = (order) => {
    const actions = [];
    const currentStatus = order.status;
    const possibleTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    // Add transition buttons based on allowed transitions
    possibleTransitions.forEach(nextStatus => {
      if (nextStatus === ORDER_STATUSES.CANCELLED) {
        // Cancel button handled separately
        return;
      }

      let buttonLabel = '';
      
      switch (nextStatus) {
        case ORDER_STATUSES.CONFIRMED:
          buttonLabel = t('providerOrders.accept');
          break;
        case ORDER_STATUSES.UNDER_PREPARATION:
          buttonLabel = currentStatus === ORDER_STATUSES.PENDING ? t('providerOrders.acceptAndPrepare') : t('providerOrders.startPreparing');
          break;
        case ORDER_STATUSES.READY:
          buttonLabel = t('providerOrders.markAsReady');
          break;
        case ORDER_STATUSES.OUT_FOR_DELIVERY:
          buttonLabel = t('providerOrders.outForDelivery');
          break;
        case ORDER_STATUSES.COMPLETED:
        case ORDER_STATUSES.DELIVERED:
          buttonLabel = t('providerOrders.markAsCompleted');
          break;
        default:
          buttonLabel = t('providerOrders.moveTo', { status: t(`orderStatus.${nextStatus}`) });
      }

      actions.push(
        <Button
          key={nextStatus}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
          onClick={() => setStatusDialog({ open: true, order, newStatus: nextStatus })}
        >
          {buttonLabel}
        </Button>
      );
    });

    // Add cancel button for cancellable statuses
    if (possibleTransitions.includes(ORDER_STATUSES.CANCELLED)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          className="shadow-sm transition-all hover:shadow-md"
          onClick={() => setCancelDialog({ open: true, order, reason: '' })}
        >
          <X className="h-4 w-4 me-1.5" />
          {t('providerOrders.cancelOrder')}
        </Button>
      );
    }

    return actions;
  };

  // Get available next statuses for dropdown
  const getNextStatuses = (currentStatus) => {
    return STATUS_TRANSITIONS[currentStatus]?.filter(s => s !== ORDER_STATUSES.CANCELLED) || [];
  };

  // Handle loading state
  if (providerLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t('providerOrders.loadingOrders')} />
      </Layout>
    );
  }

  // Handle error state
  if (ordersError) {
    return (
      <Layout>
        <ErrorMessage
          title={t('providerOrders.failedToLoad')}
          message={ordersError}
          onRetry={loadOrders}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-w-0 space-y-6 pb-8">
        {/* Enhanced Header */}
        <PageHeader
          title={t('providerOrders.title')}
          description={
            <>
              {t('providerOrders.subtitle')}
              {filteredOrders.length > 0 && (
                <span className="ms-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                  {filteredOrders.length} {filteredOrders.length === 1 ? t('providerOrders.order') : t('providerOrders.orders')}
                </span>
              )}
            </>
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="truncate">{t('common.refresh')}</span>
            </Button>
          }
        />

        {/* Enhanced Search */}
        <Card className="w-full min-w-0 shadow-sm">
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="relative w-full min-w-0">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder={t('providerOrders.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9 h-10 w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle - Active vs Past Orders */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant={viewMode === 'active' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('active');
              setActiveTab('all_active');
            }}
            className={`w-full sm:w-auto transition-all ${viewMode === 'active' ? 'bg-green-600 hover:bg-green-700 shadow-sm' : ''}`}
          >
            <Clock className="h-4 w-4 me-2 flex-shrink-0" />
            <span className="truncate">{t('providerOrders.activeOrders')}</span>
          </Button>
          <Button
            variant={viewMode === 'past' ? 'default' : 'outline'}
            onClick={() => {
              setViewMode('past');
              setPastTab('all_past');
            }}
            className={`w-full sm:w-auto transition-all ${viewMode === 'past' ? 'bg-gray-600 hover:bg-gray-700 shadow-sm' : ''}`}
          >
            <Check className="h-4 w-4 me-2 flex-shrink-0" />
            <span className="truncate">{t('providerOrders.pastOrders')}</span>
          </Button>
        </div>

        {/* Active Orders Tabs - Horizontal scroll on mobile */}
        {viewMode === 'active' && (
          <div className="w-full min-w-0 -mx-3 px-3 sm:mx-0 sm:px-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 h-auto gap-1 sm:gap-2 p-1">
                  {ACTIVE_ORDER_TABS.map(tab => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-green-100 data-[state=active]:text-green-800 shrink-0"
                    >
                      <tab.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{t(tab.labelKey)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        )}

        {/* Past Orders Tabs - Horizontal scroll on mobile */}
        {viewMode === 'past' && (
          <div className="w-full min-w-0 -mx-3 px-3 sm:mx-0 sm:px-0">
            <Tabs value={pastTab} onValueChange={setPastTab} className="w-full">
              <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 h-auto gap-1 sm:gap-2 p-1">
                  {PAST_ORDER_TABS.map(tab => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800 shrink-0"
                    >
                      <tab.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{t(tab.labelKey)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        )}

        {/* Orders List */}
        <div className="w-full min-w-0">
          {ordersLoading && !refreshing ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={t('providerOrders.noOrdersFound')}
              description={
                searchTerm
                  ? t('providerOrders.noMatchingOrders')
                  : viewMode === 'active'
                  ? t('providerOrders.noActiveOrders')
                  : t('providerOrders.noPastOrders')
              }
            />
          ) : (
            <div className="w-full min-w-0 space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="w-full min-w-0 overflow-hidden hover:shadow-lg transition-all duration-200">
                  <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                    <div className="space-y-4">
                      {/* Order Header - Enhanced */}
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                              {formatOrderId(order.id)}
                            </h3>
                            <Badge className={`${getStatusBadgeClass(order.status)} border shadow-sm whitespace-nowrap`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </div>

                          {/* Customer & Order Info with Icons */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-50 flex-shrink-0">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900 truncate">{order.customer_name}</span>
                            </div>

                            {order.customer_phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center justify-center w-5 h-5 rounded bg-green-50 flex-shrink-0">
                                  <Phone className="h-3 w-3 text-green-600" />
                                </div>
                                <a
                                  href={`tel:${order.customer_phone}`}
                                  className="text-muted-foreground hover:text-green-600 transition-colors truncate"
                                >
                                  {order.customer_phone}
                                </a>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center justify-center w-5 h-5 rounded bg-purple-50 flex-shrink-0">
                                <Calendar className="h-3 w-3 text-purple-600" />
                              </div>
                              <span className="truncate">{formatOrderDateTime(order.created_at)}</span>
                            </div>

                            {order.delivery_time_slot && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center justify-center w-5 h-5 rounded bg-orange-50 flex-shrink-0">
                                  <Clock className="h-3 w-3 text-orange-600" />
                                </div>
                                <span className="truncate">{t('providerOrders.delivery')}: {order.delivery_time_slot}</span>
                              </div>
                            )}

                            {order.delivery_address && (
                              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center justify-center w-5 h-5 rounded bg-red-50 flex-shrink-0 mt-0.5">
                                  <MapPin className="h-3 w-3 text-red-600" />
                                </div>
                                <span className="flex-1 break-words">
                                  {order.delivery_address.street_address}
                                  {order.delivery_address.city && `, ${order.delivery_address.city}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Total Amount - Enhanced */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-1 whitespace-nowrap">{t('providerOrders.totalAmount')}</p>
                          <p className="text-2xl sm:text-3xl font-bold text-green-600 whitespace-nowrap">
                            {formatPrice(order.total_amount)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items - Enhanced */}
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingBag className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-900 truncate">{t('providerOrders.orderItems')}</p>
                        </div>
                        <div className="space-y-2 bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 sm:p-4 rounded-lg border border-gray-200">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex-shrink-0">
                                  {item.quantity}
                                </span>
                                <span className="font-medium text-gray-900 truncate">{item.meal_name}</span>
                              </div>
                              <span className="font-semibold text-gray-900 flex-shrink-0 whitespace-nowrap">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Instructions - Enhanced */}
                      {order.special_instructions && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <p className="text-sm font-semibold text-blue-900 truncate">{t('providerOrders.specialInstructions')}</p>
                          </div>
                          <p className="text-sm text-blue-800 break-words">
                            {order.special_instructions}
                          </p>
                        </div>
                      )}

                      {/* Cancellation Reason - Enhanced */}
                      {order.status === ORDER_STATUSES.CANCELLED && order.cancellation_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <p className="text-sm font-semibold text-red-900 truncate">{t('providerOrders.cancellationReason')}</p>
                          </div>
                          <p className="text-sm text-red-800 break-words">
                            {order.cancellation_reason}
                          </p>
                        </div>
                      )}

                      {/* Status Dropdown for quick update - only for active orders */}
                      {viewMode === 'active' && getNextStatuses(order.status).length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t">
                          <Label className="text-sm font-semibold text-gray-900 whitespace-nowrap flex-shrink-0">{t('providerOrders.quickUpdate')}:</Label>
                          <Select
                            value=""
                            onValueChange={(value) => {
                              if (value) {
                                setStatusDialog({ open: true, order, newStatus: value });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full sm:flex-1 h-10">
                              <SelectValue placeholder={t('providerOrders.selectNewStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getNextStatuses(order.status).map(status => (
                                <SelectItem key={status} value={status}>
                                  {STATUS_LABELS[status] || status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Actions - only for active orders - Stack on mobile */}
                      {viewMode === 'active' && getStatusActions(order).length > 0 && (
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-4 border-t">
                          {getStatusActions(order).map((action, idx) => (
                            <div key={idx} className="w-full sm:w-auto sm:flex-1">
                              {action}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Status Update Confirmation Dialog */}
        <Dialog open={statusDialog.open} onOpenChange={(open) => !open && setStatusDialog({ open: false, order: null, newStatus: null })}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('providerOrders.confirmStatusUpdate')}</DialogTitle>
              <DialogDescription className="break-words">
                {t('providerOrders.confirmStatusUpdateDesc', { orderId: statusDialog.order && formatOrderId(statusDialog.order.id) })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStatusDialog({ open: false, order: null, newStatus: null })}
                disabled={updatingStatus}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                className="w-full sm:w-auto"
              >
                {updatingStatus ? t('common.updating') : t('common.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, order: null, reason: '' })}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('providerOrders.cancelOrderTitle')}</DialogTitle>
              <DialogDescription className="break-words">
                {t('providerOrders.cancelOrderDesc', { orderId: cancelDialog.order && formatOrderId(cancelDialog.order.id) })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">{t('providerOrders.cancellationReason')}</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelDialog.reason}
                  onChange={(e) => setCancelDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t('providerOrders.enterCancellationReason')}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCancelDialog({ open: false, order: null, reason: '' })}
                disabled={updatingStatus}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={updatingStatus || !cancelDialog.reason.trim()}
                className="w-full sm:w-auto"
              >
                {updatingStatus ? t('providerOrders.cancelling') : t('providerOrders.cancelOrder')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProviderOrders;
