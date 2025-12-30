/**
 * Admin Meals Management Page
 * Full meal catalog management across all providers
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Search, 
  MoreHorizontal, 
  Package, 
  Eye, 
  EyeOff,
  Trash2,
  Edit,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  TrendingUp,
  Utensils,
} from "lucide-react";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import {
  getAllMeals,
  getAllProviders,
  toggleMealAvailabilityAdmin,
  deleteMealAdmin,
  updateMealAdmin,
} from "@/services/api/admin.service";
import { formatPrice, formatDate } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

const AdminMeals = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Dialog state
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: null,
    meal: null,
    reason: "",
  });

  // Edit dialog state
  const [editDialog, setEditDialog] = useState({
    open: false,
    meal: null,
    data: {},
  });

  // Fetch providers for filter
  const { data: providers } = useQuery({
    queryKey: ["admin-providers-list"],
    queryFn: async () => {
      const result = await getAllProviders({});
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Fetch meals with filters
  const { data: meals, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-meals", selectedProvider, selectedCategory, selectedAvailability],
    queryFn: async () => {
      const filters = {};
      if (selectedProvider !== "all") filters.providerId = selectedProvider;
      if (selectedCategory !== "all") filters.category = selectedCategory;
      if (selectedAvailability !== "all") filters.isAvailable = selectedAvailability === "available";
      
      const result = await getAllMeals(filters);
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ mealId, isAvailable, reason }) => 
      toggleMealAvailabilityAdmin(mealId, isAvailable, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-meals"] });
      toast({ title: t("common.success"), description: t("adminMeals.availabilityUpdated") });
      setActionDialog({ open: false, type: null, meal: null, reason: "" });
    },
    onError: (error) => {
      toast({ 
        title: t("common.error"), 
        description: error.message || t("adminMeals.failedToUpdate"), 
        variant: "destructive" 
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ mealId, reason }) => deleteMealAdmin(mealId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-meals"] });
      toast({ title: t("common.success"), description: t("adminMeals.mealDeleted") });
      setActionDialog({ open: false, type: null, meal: null, reason: "" });
    },
    onError: (error) => {
      toast({ 
        title: t("common.error"), 
        description: error.message || t("adminMeals.failedToDelete"), 
        variant: "destructive" 
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ mealId, updates, reason }) => updateMealAdmin(mealId, updates, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-meals"] });
      toast({ title: t("common.success"), description: t("adminMeals.mealUpdated") });
      setEditDialog({ open: false, meal: null, data: {} });
    },
    onError: (error) => {
      toast({ 
        title: t("common.error"), 
        description: error.message || t("adminMeals.failedToUpdate"), 
        variant: "destructive" 
      });
    },
  });

  // Filter meals by search
  const filteredMeals = useMemo(() => {
    if (!meals) return [];
    if (!debouncedSearch) return meals;
    
    const search = debouncedSearch.toLowerCase();
    return meals.filter(
      (meal) =>
        meal.name?.toLowerCase().includes(search) ||
        meal.description?.toLowerCase().includes(search) ||
        meal.provider_name?.toLowerCase().includes(search) ||
        meal.category?.toLowerCase().includes(search)
    );
  }, [meals, debouncedSearch]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!filteredMeals?.length) {
      return { total: 0, available: 0, unavailable: 0, avgPrice: 0 };
    }
    
    const available = filteredMeals.filter(m => m.is_available).length;
    const unavailable = filteredMeals.filter(m => !m.is_available).length;
    const avgPrice = filteredMeals.reduce((sum, m) => sum + (m.price || 0), 0) / filteredMeals.length;
    
    return {
      total: filteredMeals.length,
      available,
      unavailable,
      avgPrice,
    };
  }, [filteredMeals]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!meals) return [];
    const cats = [...new Set(meals.map(m => m.category).filter(Boolean))];
    return cats.sort();
  }, [meals]);

  const handleAction = () => {
    const { type, meal, reason } = actionDialog;
    
    switch (type) {
      case "enable":
        toggleAvailabilityMutation.mutate({ 
          mealId: meal.id, 
          isAvailable: true, 
          reason 
        });
        break;
      case "disable":
        toggleAvailabilityMutation.mutate({ 
          mealId: meal.id, 
          isAvailable: false, 
          reason 
        });
        break;
      case "delete":
        deleteMutation.mutate({ mealId: meal.id, reason });
        break;
    }
  };

  const handleOpenEdit = (meal) => {
    setEditDialog({
      open: true,
      meal,
      data: {
        name: meal.name || "",
        description: meal.description || "",
        price: meal.price || 0,
        category: meal.category || "",
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
      },
    });
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      mealId: editDialog.meal.id,
      updates: editDialog.data,
      reason: "Admin update",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t("adminMeals.loading")} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorMessage
          title={t("adminMeals.loadError")}
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
            <h1 className="text-3xl font-bold tracking-tight">{t("adminMeals.title")}</h1>
            <p className="text-muted-foreground">
              {t("adminMeals.subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t("common.refresh")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">{t("adminMeals.totalMeals")}</p>
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
                  <p className="text-2xl font-bold">{stats.available}</p>
                  <p className="text-sm text-muted-foreground">{t("adminMeals.available")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.unavailable}</p>
                  <p className="text-sm text-muted-foreground">{t("adminMeals.unavailable")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.avgPrice)}</p>
                  <p className="text-sm text-muted-foreground">{t("adminMeals.avgPrice")}</p>
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
                    placeholder={t("adminMeals.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
              </div>
              
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[180px]">
                  <Users className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminMeals.provider")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminMeals.allProviders")}</SelectItem>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.business_name || provider.provider_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Utensils className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminMeals.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminMeals.allCategories")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 me-2" />
                  <SelectValue placeholder={t("adminMeals.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("adminMeals.allStatus")}</SelectItem>
                  <SelectItem value="available">{t("adminMeals.available")}</SelectItem>
                  <SelectItem value="unavailable">{t("adminMeals.unavailable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Meals List */}
        <Card>
          <CardHeader>
            <CardTitle>{t("adminMeals.meals")}</CardTitle>
            <CardDescription>
              {t("adminMeals.mealsFound", { count: filteredMeals.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMeals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMeals.map((meal) => (
                  <div 
                    key={meal.id} 
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* Image */}
                    <div className="relative h-40 bg-gray-100">
                      {meal.image_url ? (
                        <img
                          src={meal.image_url}
                          alt={meal.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {/* Action Button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(meal)}>
                            <Edit className="h-4 w-4 me-2" />
                            {t("adminMeals.editMeal")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {meal.is_available ? (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({
                                open: true,
                                type: "disable",
                                meal,
                                reason: "",
                              })}
                            >
                              <EyeOff className="h-4 w-4 me-2" />
                              {t("adminMeals.markUnavailable")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setActionDialog({
                                open: true,
                                type: "enable",
                                meal,
                                reason: "",
                              })}
                            >
                              <Eye className="h-4 w-4 me-2" />
                              {t("adminMeals.markAvailable")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setActionDialog({
                              open: true,
                              type: "delete",
                              meal,
                              reason: "",
                            })}
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t("adminMeals.deleteMeal")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Status Badge */}
                      <Badge 
                        className={`absolute bottom-2 start-2 ${
                          meal.is_available 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {meal.is_available ? t("adminMeals.available") : t("adminMeals.unavailable")}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{meal.name}</p>
                        <p className="font-bold text-primary">{formatPrice(meal.price)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {meal.provider_name || t("adminMeals.unknownProvider")}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {meal.category || t("adminMeals.uncategorized")}
                        </Badge>
                        {meal.calories && (
                          <span className="text-xs text-muted-foreground">
                            {meal.calories} cal
                          </span>
                        )}
                      </div>
                      {/* Macros */}
                      {(meal.protein || meal.carbs || meal.fat) && (
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          {meal.protein && <span>P: {meal.protein}g</span>}
                          {meal.carbs && <span>C: {meal.carbs}g</span>}
                          {meal.fat && <span>F: {meal.fat}g</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{t("adminMeals.noMealsFound")}</h3>
                <p className="text-muted-foreground">
                  {t("adminMeals.tryAdjustingFilters")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog 
          open={actionDialog.open} 
          onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, meal: null, reason: "" })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === "enable" && t("adminMeals.dialog.makeAvailable")}
                {actionDialog.type === "disable" && t("adminMeals.dialog.makeUnavailable")}
                {actionDialog.type === "delete" && t("adminMeals.dialog.deleteMeal")}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.type === "delete" 
                  ? t("adminMeals.dialog.deleteWarning")
                  : t("adminMeals.dialog.updateStatus")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">{actionDialog.meal?.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("adminMeals.provider")}: {actionDialog.meal?.provider_name}
              </p>
              <div className="mt-4">
                <Label htmlFor="reason">{t("adminProviders.reasonOptional")}</Label>
                <Textarea
                  id="reason"
                  value={actionDialog.reason}
                  onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t("adminProviders.reasonPlaceholder")}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setActionDialog({ open: false, type: null, meal: null, reason: "" })}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleAction}
                disabled={toggleAvailabilityMutation.isPending || deleteMutation.isPending}
                variant={actionDialog.type === "delete" ? "destructive" : "default"}
              >
                {actionDialog.type === "enable" && t("adminMeals.enable")}
                {actionDialog.type === "disable" && t("adminMeals.disable")}
                {actionDialog.type === "delete" && t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialog.open} 
          onOpenChange={(open) => !open && setEditDialog({ open: false, meal: null, data: {} })}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("adminMeals.editMeal")}</DialogTitle>
              <DialogDescription>
                {t("adminMeals.updateMealDetails")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="edit-name">{t("adminMeals.fields.name")}</Label>
                <Input
                  id="edit-name"
                  value={editDialog.data.name || ""}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, name: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">{t("adminMeals.fields.description")}</Label>
                <Textarea
                  id="edit-description"
                  value={editDialog.data.description || ""}
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, description: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">{t("adminMeals.fields.price")}</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editDialog.data.price || 0}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, price: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">{t("adminMeals.fields.category")}</Label>
                  <Input
                    id="edit-category"
                    value={editDialog.data.category || ""}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, category: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-calories">{t("adminMeals.fields.calories")}</Label>
                  <Input
                    id="edit-calories"
                    type="number"
                    value={editDialog.data.calories || 0}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, calories: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-protein">{t("adminMeals.fields.protein")}</Label>
                  <Input
                    id="edit-protein"
                    type="number"
                    value={editDialog.data.protein || 0}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, protein: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-carbs">{t("adminMeals.fields.carbs")}</Label>
                  <Input
                    id="edit-carbs"
                    type="number"
                    value={editDialog.data.carbs || 0}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, carbs: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fat">{t("adminMeals.fields.fat")}</Label>
                  <Input
                    id="edit-fat"
                    type="number"
                    value={editDialog.data.fat || 0}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, fat: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditDialog({ open: false, meal: null, data: {} })}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
              >
                {t("common.saveChanges")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminMeals;
