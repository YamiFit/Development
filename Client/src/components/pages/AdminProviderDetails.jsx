/**
 * Admin Provider Details Page
 * View and manage a specific provider
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  XCircle, 
  Package, 
  ShoppingBag, 
  Star,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  Shield,
  ShieldOff,
  Power,
  PowerOff,
  Pause,
  Play,
  Clock,
} from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { 
  getProviderDetails, 
  updateProviderAdmin,
  verifyProvider,
  toggleProviderActive,
  toggleProviderDisabled,
  getAllMeals,
  getAllOrders,
} from "@/services/api/admin.service";
import { formatDate, formatPrice } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";

const AdminProviderDetails = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null,
    reason: "",
  });

  // Fetch provider details
  const { data: provider, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-provider-details", providerId],
    queryFn: async () => {
      const result = await getProviderDetails(providerId);
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Fetch provider's meals
  const { data: meals } = useQuery({
    queryKey: ["admin-provider-meals", providerId],
    queryFn: async () => {
      const result = await getAllMeals({ providerId });
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!providerId,
  });

  // Fetch provider's orders
  const { data: orders } = useQuery({
    queryKey: ["admin-provider-orders", providerId],
    queryFn: async () => {
      const result = await getAllOrders({ providerId, limit: 10 });
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!providerId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ updates, reason }) => updateProviderAdmin(providerId, updates, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-provider-details", providerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Success", description: "Provider updated successfully" });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update provider", 
        variant: "destructive" 
      });
    },
  });

  // Action mutations
  const verifyMutation = useMutation({
    mutationFn: ({ isVerified, reason }) => verifyProvider(providerId, isVerified, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-provider-details", providerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Success", description: "Provider verification updated" });
      setActionDialog({ open: false, type: null, reason: "" });
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ isActive, reason }) => toggleProviderActive(providerId, isActive, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-provider-details", providerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Success", description: "Provider status updated" });
      setActionDialog({ open: false, type: null, reason: "" });
    },
  });

  const disabledMutation = useMutation({
    mutationFn: ({ isDisabled, reason }) => toggleProviderDisabled(providerId, isDisabled, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-provider-details", providerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Success", description: "Provider disabled status updated" });
      setActionDialog({ open: false, type: null, reason: "" });
    },
  });

  const handleStartEdit = () => {
    setEditData({
      business_name: provider?.business_name || "",
      provider_name: provider?.provider_name || "",
      email: provider?.email || "",
      phone: provider?.phone || "",
      address: provider?.address || "",
      admin_notes: provider?.admin_notes || "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({ updates: editData, reason: "Admin update" });
  };

  const handleAction = () => {
    const { type, reason } = actionDialog;
    
    switch (type) {
      case "verify":
        verifyMutation.mutate({ isVerified: true, reason });
        break;
      case "unverify":
        verifyMutation.mutate({ isVerified: false, reason });
        break;
      case "activate":
        activeMutation.mutate({ isActive: true, reason });
        break;
      case "deactivate":
        activeMutation.mutate({ isActive: false, reason });
        break;
      case "disable":
        disabledMutation.mutate({ isDisabled: true, reason });
        break;
      case "enable":
        disabledMutation.mutate({ isDisabled: false, reason });
        break;
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-green-100 text-green-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading provider details..." />
      </Layout>
    );
  }

  if (error || !provider) {
    return (
      <Layout>
        <ErrorMessage
          title="Failed to load provider"
          message={error?.message || "Provider not found"}
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin/providers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {provider.business_name || provider.provider_name || "Provider Details"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {provider.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {!provider.is_active && (
                  <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                )}
                {provider.is_temporarily_disabled && (
                  <Badge className="bg-yellow-100 text-yellow-800">Temporarily Disabled</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={handleStartEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Provider
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage provider status and verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Verification */}
              {provider.is_verified ? (
                <Button 
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, type: "unverify", reason: "" })}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Remove Verification
                </Button>
              ) : (
                <Button 
                  onClick={() => setActionDialog({ open: true, type: "verify", reason: "" })}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Provider
                </Button>
              )}

              {/* Active Status */}
              {provider.is_active ? (
                <Button 
                  variant="destructive"
                  onClick={() => setActionDialog({ open: true, type: "deactivate", reason: "" })}
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, type: "activate", reason: "" })}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Activate
                </Button>
              )}

              {/* Temporarily Disable */}
              {provider.is_temporarily_disabled ? (
                <Button 
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, type: "enable", reason: "" })}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Enable
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => setActionDialog({ open: true, type: "disable", reason: "" })}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Temporarily Disable
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="meals">Meals ({meals?.length || 0})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders?.length || 0})</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="business_name">Business Name</Label>
                        <Input
                          id="business_name"
                          value={editData.business_name}
                          onChange={(e) => setEditData(prev => ({ ...prev, business_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider_name">Provider Name</Label>
                        <Input
                          id="provider_name"
                          value={editData.provider_name}
                          onChange={(e) => setEditData(prev => ({ ...prev, provider_name: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {provider.profile_image_url ? (
                            <img
                              src={provider.profile_image_url}
                              alt={provider.business_name}
                              className="w-16 h-16 object-cover"
                            />
                          ) : (
                            <Users className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {provider.business_name || "No business name"}
                          </p>
                          <p className="text-muted-foreground">{provider.provider_name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="font-medium flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {provider.rating || "N/A"} ({provider.total_reviews || 0} reviews)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Joined</p>
                          <p className="font-medium">{formatDate(provider.created_at)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editData.phone}
                          onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={editData.address}
                          onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.address || "No address"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-bold text-lg">{provider.meals_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Meals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <ShoppingBag className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-bold text-lg">{provider.orders_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Total Orders</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editData.admin_notes}
                      onChange={(e) => setEditData(prev => ({ ...prev, admin_notes: e.target.value }))}
                      placeholder="Add notes about this provider..."
                      rows={4}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {provider.admin_notes || "No admin notes"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Meals Tab */}
          <TabsContent value="meals">
            <Card>
              <CardHeader>
                <CardTitle>Provider Meals</CardTitle>
                <CardDescription>All meals offered by this provider</CardDescription>
              </CardHeader>
              <CardContent>
                {meals?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {meals.map((meal) => (
                      <div 
                        key={meal.id} 
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {meal.image_url && (
                          <img
                            src={meal.image_url}
                            alt={meal.name}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{meal.name}</p>
                            <Badge variant={meal.is_available ? "success" : "secondary"}>
                              {meal.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {meal.category} · {formatPrice(meal.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">No meals found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Orders containing this provider's meals</CardDescription>
              </CardHeader>
              <CardContent>
                {orders?.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div 
                        key={order.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/admin/orders?id=${order.id}`)}
                      >
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items_count} items · {formatPrice(order.total_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusBadge(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog 
          open={actionDialog.open} 
          onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, reason: "" })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === "verify" && "Verify Provider"}
                {actionDialog.type === "unverify" && "Remove Verification"}
                {actionDialog.type === "activate" && "Activate Provider"}
                {actionDialog.type === "deactivate" && "Deactivate Provider"}
                {actionDialog.type === "disable" && "Temporarily Disable Provider"}
                {actionDialog.type === "enable" && "Enable Provider"}
              </DialogTitle>
              <DialogDescription>
                This action will be logged. Please provide a reason if applicable.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={actionDialog.reason}
                onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter a reason..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, reason: "" })}>
                Cancel
              </Button>
              <Button 
                onClick={handleAction}
                disabled={verifyMutation.isPending || activeMutation.isPending || disabledMutation.isPending}
                variant={actionDialog.type === "deactivate" ? "destructive" : "default"}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminProviderDetails;
