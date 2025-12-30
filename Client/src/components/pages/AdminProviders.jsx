/**
 * Admin Providers Page
 * Manage all meal providers - verification, activation, etc.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MoreHorizontal,
  Shield,
  ShieldOff,
  Power,
  PowerOff,
  Pause,
  Play,
  Package,
  ShoppingBag,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import { 
  getAllProviders, 
  verifyProvider, 
  toggleProviderActive, 
  toggleProviderDisabled 
} from "@/services/api/admin.service";
import { formatDate } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

const AdminProviders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState(
    searchParams.get("filter") === "unverified" ? "false" : "all"
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const debouncedSearch = useDebounce(search, 300);

  // Dialog state
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null, // 'verify' | 'unverify' | 'activate' | 'deactivate' | 'disable' | 'enable'
    provider: null,
    reason: "",
  });

  // Fetch providers
  const { data: providers, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-providers", debouncedSearch, verifiedFilter, activeFilter],
    queryFn: async () => {
      const result = await getAllProviders({
        search: debouncedSearch || undefined,
        verified: verifiedFilter !== "all" ? verifiedFilter : undefined,
        active: activeFilter !== "all" ? activeFilter : undefined,
      });
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: ({ providerId, isVerified, reason }) => 
      verifyProvider(providerId, isVerified, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      toast({
        title: t("common.success"),
        description: actionDialog.type === "verify" 
          ? t("adminProviders.providerVerified") 
          : t("adminProviders.verificationRemoved"),
      });
      setActionDialog({ open: false, type: null, provider: null, reason: "" });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("adminProviders.failedToUpdate"),
        variant: "destructive",
      });
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ providerId, isActive, reason }) => 
      toggleProviderActive(providerId, isActive, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      toast({
        title: t("common.success"),
        description: actionDialog.type === "activate" 
          ? t("adminProviders.providerActivated") 
          : t("adminProviders.providerDeactivated"),
      });
      setActionDialog({ open: false, type: null, provider: null, reason: "" });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("adminProviders.failedToUpdate"),
        variant: "destructive",
      });
    },
  });

  const disabledMutation = useMutation({
    mutationFn: ({ providerId, isDisabled, reason }) => 
      toggleProviderDisabled(providerId, isDisabled, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({
        title: t("common.success"),
        description: actionDialog.type === "disable" 
          ? t("adminProviders.providerDisabled") 
          : t("adminProviders.providerEnabled"),
      });
      setActionDialog({ open: false, type: null, provider: null, reason: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update provider",
        variant: "destructive",
      });
    },
  });

  const handleAction = () => {
    const { type, provider, reason } = actionDialog;
    
    switch (type) {
      case "verify":
        verifyMutation.mutate({ providerId: provider.id, isVerified: true, reason });
        break;
      case "unverify":
        verifyMutation.mutate({ providerId: provider.id, isVerified: false, reason });
        break;
      case "activate":
        activeMutation.mutate({ providerId: provider.id, isActive: true, reason });
        break;
      case "deactivate":
        activeMutation.mutate({ providerId: provider.id, isActive: false, reason });
        break;
      case "disable":
        disabledMutation.mutate({ providerId: provider.id, isDisabled: true, reason });
        break;
      case "enable":
        disabledMutation.mutate({ providerId: provider.id, isDisabled: false, reason });
        break;
    }
  };

  const getDialogTitle = () => {
    const titles = {
      verify: t("adminProviders.dialog.verifyProvider"),
      unverify: t("adminProviders.dialog.removeVerification"),
      activate: t("adminProviders.dialog.activateProvider"),
      deactivate: t("adminProviders.dialog.deactivateProvider"),
      disable: t("adminProviders.dialog.disableProvider"),
      enable: t("adminProviders.dialog.enableProvider"),
    };
    return titles[actionDialog.type] || t("adminProviders.dialog.confirmAction");
  };

  const getDialogDescription = () => {
    const provider = actionDialog.provider;
    const name = provider?.business_name || provider?.provider_name || t("adminProviders.thisProvider");
    
    const descriptions = {
      verify: t("adminProviders.dialog.verifyDesc", { name }),
      unverify: t("adminProviders.dialog.unverifyDesc", { name }),
      activate: t("adminProviders.dialog.activateDesc", { name }),
      deactivate: t("adminProviders.dialog.deactivateDesc", { name }),
      disable: t("adminProviders.dialog.disableDesc", { name }),
      enable: t("adminProviders.dialog.enableDesc", { name }),
    };
    return descriptions[actionDialog.type] || t("adminProviders.dialog.proceedConfirm");
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t("adminProviders.loading")} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage
          title={t("adminProviders.loadError")}
          message={error?.message || t("common.error")}
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
            <h1 className="text-3xl font-bold tracking-tight">{t("adminProviders.title")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("adminProviders.subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t("common.refresh")}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("adminProviders.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t("adminProviders.verificationStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminProviders.allStatus")}</SelectItem>
                  <SelectItem value="true">{t("adminProviders.verified")}</SelectItem>
                  <SelectItem value="false">{t("adminProviders.unverified")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={t("adminProviders.activeStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminProviders.allActive")}</SelectItem>
                  <SelectItem value="true">{t("adminProviders.active")}</SelectItem>
                  <SelectItem value="false">{t("adminProviders.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{providers?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{t("adminProviders.totalShown")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {providers?.filter(p => p.is_verified).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("adminProviders.verified")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Pause className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {providers?.filter(p => p.is_temporarily_disabled).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("adminProviders.disabled")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {providers?.filter(p => !p.is_active).length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("adminProviders.inactive")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Providers List */}
        <Card>
          <CardHeader>
            <CardTitle>{t("adminProviders.allProviders")}</CardTitle>
            <CardDescription>
              {t("adminProviders.clickToViewDetails")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {providers?.length > 0 ? (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {provider.profile_image_url ? (
                          <img
                            src={provider.profile_image_url}
                            alt={provider.business_name}
                            className="w-12 h-12 object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-gray-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {provider.business_name || provider.provider_name || t("adminProviders.unnamedProvider")}
                          </p>
                          {provider.is_verified && (
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 me-1" />
                              {t("adminProviders.verified")}
                            </Badge>
                          )}
                          {!provider.is_active && (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              {t("adminProviders.inactive")}
                            </Badge>
                          )}
                          {provider.is_temporarily_disabled && (
                            <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                              {t("adminProviders.disabled")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{provider.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {provider.meals_count || 0} {t("adminProviders.meals")}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            {provider.orders_count || 0} {t("adminProviders.orders")}
                          </span>
                          {provider.rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {provider.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/providers/${provider.id}`)}
                      >
                        <Eye className="h-4 w-4 me-1" />
                        {t("common.view")}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {/* Verification */}
                          {provider.is_verified ? (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "unverify",
                                provider,
                                reason: "",
                              })}
                            >
                              <ShieldOff className="h-4 w-4 me-2" />
                              {t("adminProviders.removeVerification")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "verify",
                                provider,
                                reason: "",
                              })}
                            >
                              <Shield className="h-4 w-4 me-2" />
                              {t("adminProviders.verifyProvider")}
                            </DropdownMenuItem>
                          )}

                          {/* Active Status */}
                          {provider.is_active ? (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "deactivate",
                                provider,
                                reason: "",
                              })}
                              className="text-red-600"
                            >
                              <PowerOff className="h-4 w-4 me-2" />
                              {t("adminProviders.deactivate")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "activate",
                                provider,
                                reason: "",
                              })}
                            >
                              <Power className="h-4 w-4 me-2" />
                              {t("adminProviders.activate")}
                            </DropdownMenuItem>
                          )}

                          {/* Temporarily Disable */}
                          {provider.is_temporarily_disabled ? (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "enable",
                                provider,
                                reason: "",
                              })}
                            >
                              <Play className="h-4 w-4 me-2" />
                              {t("adminProviders.enable")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "disable",
                                provider,
                                reason: "",
                              })}
                            >
                              <Pause className="h-4 w-4 me-2" />
                              {t("adminProviders.temporarilyDisable")}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => navigate(`/admin/providers/${provider.id}`)}
                          >
                            <Eye className="h-4 w-4 me-2" />
                            {t("adminProviders.viewDetails")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mb-3" />
                <p className="font-medium">{t("adminProviders.noProvidersFound")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("adminProviders.tryAdjustingFilters")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Confirmation Dialog */}
        <Dialog 
          open={actionDialog.open} 
          onOpenChange={(open) => {
            if (!open) {
              setActionDialog({ open: false, type: null, provider: null, reason: "" });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>{getDialogDescription()}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">{t("adminProviders.reasonOptional")}</Label>
              <Textarea
                id="reason"
                placeholder={t("adminProviders.reasonPlaceholder")}
                value={actionDialog.reason}
                onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ open: false, type: null, provider: null, reason: "" })}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleAction}
                disabled={verifyMutation.isPending || activeMutation.isPending || disabledMutation.isPending}
                variant={actionDialog.type === "deactivate" ? "destructive" : "default"}
              >
                {(verifyMutation.isPending || activeMutation.isPending || disabledMutation.isPending) 
                  ? t("common.processing") 
                  : t("common.confirm")
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminProviders;
