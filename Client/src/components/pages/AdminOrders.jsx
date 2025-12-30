/**
 * Admin Orders Management Page
 * Full order oversight and management
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MoreHorizontal, 
  ShoppingBag, 
  Eye,
  XCircle,
  RefreshCw,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import {
  getAllOrders,
  getOrderDetails,
  forceCancelOrder,
  updateOrderStatusAdmin,
  getAllProviders,
} from "@/services/api/admin.service";
import { formatPrice, formatDate } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "preparing", label: "Preparing", color: "bg-orange-100 text-orange-800" },
  { value: "ready", label: "Ready", color: "bg-green-100 text-green-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

const AdminOrders = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get order ID from URL if present
  const orderIdFromUrl = searchParams.get("id");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Dialog state
  const [viewOrderDialog, setViewOrderDialog] = useState({
    open: false,
    orderId: null,
  });

  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    order: null,
    reason: "",
    refund: false,
  });

  const [statusDialog, setStatusDialog] = useState({
    open: false,
    order: null,
    newStatus: "",
    reason: "",
  });

  // Open order details from URL
  useState(() => {
    if (orderIdFromUrl) {
      setViewOrderDialog({ open: true, orderId: orderIdFromUrl });
    }
  }, [orderIdFromUrl]);

  // Fetch providers for filter
  const { data: providers } = useQuery({
    queryKey: ["admin-providers-list"],
    queryFn: async () => {
      const result = await getAllProviders({});
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Fetch orders with filters
  const { data: ordersResult, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-orders", selectedStatus, selectedProvider, dateRange, page],
    queryFn: async () => {
      const filters = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (selectedStatus !== "all") filters.status = selectedStatus;
      if (selectedProvider !== "all") filters.providerId = selectedProvider;
      
      // Date range filtering
      if (dateRange !== "all") {
        const now = new Date();
        let startDate;
        switch (dateRange) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }
        if (startDate) filters.startDate = startDate.toISOString();
      }
      
      const result = await getAllOrders(filters);
      if (result.error) throw result.error;
      return result;
    },
  });

  // Fetch single order details
  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["admin-order-details", viewOrderDialog.orderId],
    queryFn: async () => {
      const result = await getOrderDetails(viewOrderDialog.orderId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!viewOrderDialog.orderId && viewOrderDialog.open,
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason, refund }) => forceCancelOrder(orderId, reason, refund),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: t("common.success"), description: t("adminOrders.orderCancelled") });
      setCancelDialog({ open: false, order: null, reason: "", refund: false });
    },
    onError: (error) => {
      toast({ 
        title: t("common.error"), 
        description: error.message || t("adminOrders.failedToCancel"), 
        variant: "destructive" 
      });
    },
  });

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, newStatus, reason }) => 
      updateOrderStatusAdmin(orderId, newStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-details"] });
      toast({ title: t("common.success"), description: t("adminOrders.statusUpdated") });
      setStatusDialog({ open: false, order: null, newStatus: "", reason: "" });
    },
    onError: (error) => {
      toast({ 
        title: t("common.error"), 
        description: error.message || t("adminOrders.failedToUpdateStatus"), 
        variant: "destructive" 
      });
    },
  });

  // Filter orders by search
  const orders = ordersResult?.data || [];
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch) return orders;
    
    const search = debouncedSearch.toLowerCase();
    return orders.filter(
      (order) =>
        order.id?.toLowerCase().includes(search) ||
        order.customer_name?.toLowerCase().includes(search) ||
        order.customer_email?.toLowerCase().includes(search) ||
        order.provider_name?.toLowerCase().includes(search)
    );
  }, [orders, debouncedSearch]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!orders?.length) {
      return { 
        total: 0, 
        pending: 0, 
        inProgress: 0, 
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
      };
    }
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === "pending").length,
      inProgress: orders.filter(o => ["confirmed", "preparing", "ready"].includes(o.status)).length,
      completed: orders.filter(o => ["delivered", "completed"].includes(o.status)).length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      totalRevenue: orders
        .filter(o => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0),
    };
  }, [orders]);

  const getStatusBadge = (status) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return statusConfig?.color || "bg-gray-100 text-gray-800";
  };

  const handleViewOrder = (orderId) => {
    setViewOrderDialog({ open: true, orderId });
    setSearchParams({ id: orderId });
  };

  const handleCloseViewOrder = () => {
    setViewOrderDialog({ open: false, orderId: null });
    setSearchParams({});
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t("adminOrders.loading")} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage
          title={t("adminOrders.loadError")}
          message={error.message}
          onRetry={refetch}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("adminOrders.title")}</h1>
            <p className="text-muted-foreground">
              {t("adminOrders.subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t("common.refresh")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">{t("adminOrders.totalOrders")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">{t("adminOrders.pending")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Truck className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">{t("adminOrders.inProgress")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">{t("adminOrders.completed")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                  <p className="text-sm text-muted-foreground">{t("adminOrders.revenue")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("adminOrders.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminOrders.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminOrders.allStatus")}</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminOrders.provider")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminOrders.allProviders")}</SelectItem>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.business_name || provider.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminOrders.date")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminOrders.allTime")}</SelectItem>
                  <SelectItem value="today">{t("adminOrders.today")}</SelectItem>
                  <SelectItem value="week">{t("adminOrders.lastWeek")}</SelectItem>
                  <SelectItem value="month">{t("adminOrders.lastMonth")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("adminOrders.orders")}</CardTitle>
            <CardDescription>
              {t("adminOrders.ordersFound", { count: filteredOrders.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrders.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("adminOrders.orderId")}</TableHead>
                        <TableHead>{t("adminOrders.customer")}</TableHead>
                        <TableHead>{t("adminOrders.provider")}</TableHead>
                        <TableHead>{t("adminOrders.items")}</TableHead>
                        <TableHead>{t("adminOrders.total")}</TableHead>
                        <TableHead>{t("adminOrders.status")}</TableHead>
                        <TableHead>{t("adminOrders.date")}</TableHead>
                        <TableHead className="w-[80px]">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{order.provider_name || "N/A"}</TableCell>
                          <TableCell>{order.items_count || 0}</TableCell>
                          <TableCell className="font-medium">{formatPrice(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                  <Eye className="h-4 w-4 me-2" />
                                  {t("adminOrders.viewDetails")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setStatusDialog({
                                    open: true,
                                    order,
                                    newStatus: "",
                                    reason: "",
                                  })}
                                >
                                  <RefreshCw className="h-4 w-4 me-2" />
                                  {t("adminOrders.updateStatus")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {order.status !== "cancelled" && order.status !== "completed" && (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setCancelDialog({
                                      open: true,
                                      order,
                                      reason: "",
                                      refund: false,
                                    })}
                                  >
                                    <XCircle className="h-4 w-4 me-2" />
                                    {t("adminOrders.forceCancel")}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("adminOrders.showing", { from: ((page - 1) * pageSize) + 1, to: Math.min(page * pageSize, ordersResult?.count || 0), total: ordersResult?.count || 0 })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("common.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * pageSize >= (ordersResult?.count || 0)}
                    >
                      {t("common.next")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{t("adminOrders.noOrdersFound")}</h3>
                <p className="text-muted-foreground">
                  {t("adminOrders.tryAdjustingFilters")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Order Dialog */}
        <Dialog open={viewOrderDialog.open} onOpenChange={handleCloseViewOrder}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("adminOrders.orderDetails")}</DialogTitle>
              <DialogDescription>
                {t("adminOrders.orderId")}: {viewOrderDialog.orderId}
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingDetails ? (
              <div className="py-8">
                <LoadingSpinner message={t("adminOrders.loadingDetails")} />
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusBadge(orderDetails.status)} text-sm px-3 py-1`}>
                    {orderDetails.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(orderDetails.created_at)}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{t("adminOrders.customerInfo")}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("adminOrders.name")}:</span>{" "}
                      <span className="font-medium">{orderDetails.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("adminOrders.email")}:</span>{" "}
                      <span>{orderDetails.customer_email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("adminOrders.phone")}:</span>{" "}
                      <span>{orderDetails.customer_phone || t("common.notAvailable")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("adminOrders.delivery")}:</span>{" "}
                      <span>{orderDetails.delivery_type || t("common.notAvailable")}</span>
                    </div>
                  </div>
                  {orderDetails.delivery_address && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">{t("adminOrders.address")}:</span>{" "}
                      <span>{orderDetails.delivery_address}</span>
                    </div>
                  )}
                </div>

                {/* Provider Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{t("adminOrders.provider")}</h4>
                  <p>{orderDetails.provider_name || t("common.notAvailable")}</p>
                </div>

                {/* Order Items */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{t("adminOrders.orderItems")}</h4>
                  <div className="space-y-3">
                    {orderDetails.order_items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.meal_name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.meal_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">{formatPrice(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{t("adminOrders.orderSummary")}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("adminOrders.subtotal")}</span>
                      <span>{formatPrice(orderDetails.subtotal || orderDetails.total_amount)}</span>
                    </div>
                    {orderDetails.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("adminOrders.deliveryFee")}</span>
                        <span>{formatPrice(orderDetails.delivery_fee)}</span>
                      </div>
                    )}
                    {orderDetails.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{t("adminOrders.discount")}</span>
                        <span>-{formatPrice(orderDetails.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>{t("adminOrders.total")}</span>
                      <span>{formatPrice(orderDetails.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {orderDetails.special_instructions && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{t("adminOrders.specialInstructions")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {orderDetails.special_instructions}
                    </p>
                  </div>
                )}

                {/* Cancellation Info */}
                {orderDetails.status === "cancelled" && orderDetails.cancelled_by && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t("adminOrders.cancellationDetails")}
                    </h4>
                    <div className="text-sm text-red-700 space-y-1">
                      <p>{t("adminOrders.cancelledAt")}: {formatDate(orderDetails.cancelled_at)}</p>
                      {orderDetails.cancellation_reason && (
                        <p>{t("adminOrders.reason")}: {orderDetails.cancellation_reason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t("adminOrders.orderNotFound")}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseViewOrder}>
                {t("common.close")}
              </Button>
              {orderDetails && orderDetails.status !== "cancelled" && orderDetails.status !== "completed" && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleCloseViewOrder();
                    setCancelDialog({
                      open: true,
                      order: orderDetails,
                      reason: "",
                      refund: false,
                    });
                  }}
                >
                  <XCircle className="h-4 w-4 me-2" />
                  {t("adminOrders.cancelOrder")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog 
          open={cancelDialog.open} 
          onOpenChange={(open) => !open && setCancelDialog({ open: false, order: null, reason: "", refund: false })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                {t("adminOrders.forceCancelOrder")}
              </DialogTitle>
              <DialogDescription>
                {t("adminOrders.forceCancelWarning")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{t("adminOrders.order")}: {cancelDialog.order?.id?.slice(0, 8)}...</p>
                <p className="text-sm text-muted-foreground">
                  {t("adminOrders.customer")}: {cancelDialog.order?.customer_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("adminOrders.total")}: {formatPrice(cancelDialog.order?.total_amount)}
                </p>
              </div>
              <div>
                <Label htmlFor="cancel-reason">{t("adminOrders.cancellationReasonRequired")}</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelDialog.reason}
                  onChange={(e) => setCancelDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t("adminOrders.enterCancellationReason")}
                  className="mt-2"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="refund"
                  checked={cancelDialog.refund}
                  onChange={(e) => setCancelDialog(prev => ({ ...prev, refund: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="refund" className="text-sm font-normal">
                  {t("adminOrders.processRefund")}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setCancelDialog({ open: false, order: null, reason: "", refund: false })}
              >
                {t("common.back")}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => cancelMutation.mutate({
                  orderId: cancelDialog.order.id,
                  reason: cancelDialog.reason,
                  refund: cancelDialog.refund,
                })}
                disabled={!cancelDialog.reason || cancelMutation.isPending}
              >
                {t("adminOrders.confirmCancellation")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog 
          open={statusDialog.open} 
          onOpenChange={(open) => !open && setStatusDialog({ open: false, order: null, newStatus: "", reason: "" })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("adminOrders.updateOrderStatus")}</DialogTitle>
              <DialogDescription>
                {t("adminOrders.changeStatusDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{t("adminOrders.order")}: {statusDialog.order?.id?.slice(0, 8)}...</p>
                <p className="text-sm text-muted-foreground">
                  {t("adminOrders.currentStatus")}: {statusDialog.order?.status}
                </p>
              </div>
              <div>
                <Label htmlFor="new-status">{t("adminOrders.newStatus")}</Label>
                <Select 
                  value={statusDialog.newStatus} 
                  onValueChange={(value) => setStatusDialog(prev => ({ ...prev, newStatus: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t("adminOrders.selectNewStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES
                      .filter(s => s.value !== statusDialog.order?.status)
                      .map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-reason">{t("adminProviders.reasonOptional")}</Label>
                <Textarea
                  id="status-reason"
                  value={statusDialog.reason}
                  onChange={(e) => setStatusDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t("adminOrders.enterStatusChangeReason")}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setStatusDialog({ open: false, order: null, newStatus: "", reason: "" })}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={() => statusMutation.mutate({
                  orderId: statusDialog.order.id,
                  newStatus: statusDialog.newStatus,
                  reason: statusDialog.reason,
                })}
                disabled={!statusDialog.newStatus || statusMutation.isPending}
              >
                {t("adminOrders.updateStatus")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminOrders;
