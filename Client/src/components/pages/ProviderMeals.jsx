/**
 * Provider Meals Page
 * Manage meal offerings - create, edit, and toggle availability
 * MOBILE-FIRST: Responsive grid, proper filters, confirmation dialogs
 */

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import PageHeader from '../shared/PageHeader';
import ConfirmDialog from '../shared/ConfirmDialog';
import LoadingSkeleton, { MealCardSkeleton } from '../shared/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, Edit2, Power, DollarSign, Flame, CheckCircle, XCircle, Utensils, Clock, Image as ImageIcon } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import EmptyState from '../shared/EmptyState';
import MealFormDialog from '../provider/MealFormDialog';
import { useProviderInit } from '@/hooks/useProviderInit';
import { useDebounce } from '@/hooks/useDebounce';
import { setMeals, setMealsLoading, setMealsError, setFilters, updateMeal as updateMealRedux, removeMeal } from '@/store/slices/mealsSlice';
import { selectFilteredMeals, selectMealsFilters, selectMealsLoading, selectMealsError } from '@/store/selectors';
import { getMealsByProvider, toggleMealAvailability, deleteMeal } from '@/services/api/meals.service';
import { MEAL_FILTER_OPTIONS } from '@/config/provider.constants';
import { useToast } from '@/hooks/use-toast';

const ProviderMeals = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { provider, loading: providerLoading } = useProviderInit();
  const meals = useSelector(selectFilteredMeals);
  const filters = useSelector(selectMealsFilters);
  const mealsLoading = useSelector(selectMealsLoading);
  const mealsError = useSelector(selectMealsError);

  const debouncedSearch = useDebounce(filters.search, 300);

  // Modal state
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, meal: null });
  const [deletingMeal, setDeletingMeal] = useState(false);

  // Load meals when provider is available
  useEffect(() => {
    if (provider?.id) {
      loadMeals();
    }
  }, [provider?.id, filters.category, filters.availability, debouncedSearch]);

  const loadMeals = async () => {
    if (!provider?.id) return;

    dispatch(setMealsLoading(true));

    try {
      const { data, error } = await getMealsByProvider(provider.id, {
        category: filters.category !== 'all' ? filters.category : undefined,
        availability: filters.availability !== 'all' ? filters.availability : undefined,
        search: debouncedSearch || undefined,
      });

      if (error) throw error;

      dispatch(setMeals(data));
    } catch (err) {
      console.error('Error loading meals:', err);
      dispatch(setMealsError(err.message || 'Failed to load meals'));
    } finally {
      dispatch(setMealsLoading(false));
    }
  };

  // Handle filter changes
  const handleCategoryChange = (value) => {
    dispatch(setFilters({ category: value }));
  };

  const handleAvailabilityChange = (value) => {
    dispatch(setFilters({ availability: value }));
  };

  const handleSearchChange = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  // Handle add meal
  const handleAddMeal = () => {
    setSelectedMeal(null);
    setShowMealDialog(true);
  };

  // Handle edit meal
  const handleEditMeal = (meal) => {
    setSelectedMeal(meal);
    setShowMealDialog(true);
  };

  // Handle toggle availability
  const handleToggleAvailability = async (meal) => {
    try {
      const newAvailability = !meal.is_available;
      const { data, error } = await toggleMealAvailability(meal.id, newAvailability);

      if (error) throw error;

      // Update Redux state
      dispatch(updateMealRedux(data));

      toast({
        title: t('common.success'),
        description: newAvailability ? t('providerMeals.mealEnabled') : t('providerMeals.mealDisabled'),
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
      toast({
        title: t('common.error'),
        description: err.message || t('providerMeals.failedToUpdate'),
        variant: 'destructive',
      });
    }
  };

  // Handle delete meal
  const handleDeleteMeal = async (meal) => {
    setDeleteDialog({ open: true, meal });
  };

  const confirmDeleteMeal = async () => {
    const meal = deleteDialog.meal;
    if (!meal) return;

    setDeletingMeal(true);

    try {
      const { error } = await deleteMeal(meal.id);

      if (error) throw error;

      // Remove from Redux state
      dispatch(removeMeal(meal.id));

      toast({
        title: t('common.success'),
        description: t('providerMeals.mealDeleted'),
      });

      setDeleteDialog({ open: false, meal: null });
    } catch (err) {
      console.error('Error deleting meal:', err);
      toast({
        title: t('common.error'),
        description: err.message || t('providerMeals.failedToDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeletingMeal(false);
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setShowMealDialog(false);
    setSelectedMeal(null);
  };

  // Handle loading state
  if (providerLoading) {
    return (
      <Layout>
        <LoadingSpinner message={t('providerMeals.loadingMeals')} />
      </Layout>
    );
  }

  // Handle error state
  if (mealsError) {
    return (
      <Layout>
        <ErrorMessage
          title={t('providerMeals.failedToLoadMeals')}
          message={mealsError}
          onRetry={loadMeals}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full min-w-0 space-y-6 pb-8">
        {/* Enhanced Header */}
        <PageHeader
          title={t('providerMeals.title')}
          description={
            <>
              {t('providerMeals.subtitle')}
              {meals.length > 0 && (
                <span className="ms-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                  {meals.length} {meals.length === 1 ? t('providerMeals.meal') : t('providerMeals.meals')}
                </span>
              )}
            </>
          }
          actionLabel={t('providerMeals.addMeal')}
          onAction={handleAddMeal}
          actionIcon={Plus}
        />

        {/* Enhanced Filters */}
        <Card className="w-full min-w-0 shadow-sm">
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="w-full min-w-0 flex flex-col gap-3">
              {/* Search - Full width */}
              <div className="w-full min-w-0 relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder={t('providerMeals.searchPlaceholder')}
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="ps-9 h-10 w-full"
                />
              </div>

              {/* Category and Availability Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Category Filter */}
                <Select value={filters.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full sm:flex-1 h-10">
                    <SelectValue placeholder={t('providerMeals.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_FILTER_OPTIONS.CATEGORY.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Availability Filter */}
                <Select value={filters.availability} onValueChange={handleAvailabilityChange}>
                  <SelectTrigger className="w-full sm:flex-1 h-10">
                    <SelectValue placeholder={t('providerMeals.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_FILTER_OPTIONS.AVAILABILITY.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {(filters.search || filters.category !== 'all' || filters.availability !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      dispatch(setFilters({ search: '', category: 'all', availability: 'all' }));
                    }}
                    className="h-10 w-full sm:w-auto whitespace-nowrap"
                  >
                    {t('common.clearFilters')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
        {mealsLoading ? (
          <div className="w-full min-w-0 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MealCardSkeleton key={i} />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <EmptyState
            icon={Plus}
            title={
              filters.search || filters.category !== 'all' || filters.availability !== 'all'
                ? t('providerMeals.noMealsFound')
                : t('providerMeals.noMealsYet')
            }
            description={
              filters.search || filters.category !== 'all' || filters.availability !== 'all'
                ? t('providerMeals.noMealsMatchFilters')
                : t('providerMeals.startByCreating')
            }
            actionLabel={
              !filters.search && filters.category === 'all' && filters.availability === 'all'
                ? t('providerMeals.addFirstMeal')
                : undefined
            }
            onAction={
              !filters.search && filters.category === 'all' && filters.availability === 'all'
                ? handleAddMeal
                : undefined
            }
          />
        ) : (
          <div className="w-full min-w-0 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => {
              // Helper function to get category badge color
              const getCategoryColor = (category) => {
                const colors = {
                  breakfast: 'bg-orange-100 text-orange-800 border-orange-200',
                  lunch: 'bg-blue-100 text-blue-800 border-blue-200',
                  dinner: 'bg-purple-100 text-purple-800 border-purple-200',
                  snack: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                };
                return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
              };

              // Helper function to get category icon
              const getCategoryIcon = (category) => {
                const icons = {
                  breakfast: Clock,
                  lunch: Utensils,
                  dinner: Utensils,
                  snack: Utensils,
                };
                const Icon = icons[category?.toLowerCase()] || Utensils;
                return Icon;
              };

              const CategoryIcon = getCategoryIcon(meal.category);

              return (
                <Card
                  key={meal.id}
                  className="w-full min-w-0 overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {meal.image_url ? (
                      <img
                        src={meal.image_url}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <Badge
                      className={`absolute top-3 left-3 ${getCategoryColor(meal.category)} flex items-center gap-1 shadow-sm whitespace-nowrap`}
                    >
                      <CategoryIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{meal.category}</span>
                    </Badge>

                    {/* Availability Badge */}
                    <Badge
                      className={`absolute top-3 end-3 shadow-sm whitespace-nowrap ${
                        meal.is_available
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {meal.is_available ? (
                        <>
                          <CheckCircle className="h-3 w-3 me-1 flex-shrink-0" />
                          {t('providerMeals.available')}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 me-1 flex-shrink-0" />
                          {t('providerMeals.unavailable')}
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Content Section */}
                  <CardHeader className="pb-3 px-4">
                    <CardTitle className="text-base sm:text-lg line-clamp-1 group-hover:text-green-600 transition-colors">
                      {meal.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {meal.description || t('providerMeals.noDescription')}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 px-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100 min-w-0">
                        <div className="p-1.5 rounded bg-green-100 flex-shrink-0">
                          <DollarSign className="h-4 w-4 text-green-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground truncate">{t('providerMeals.price')}</p>
                          <p className="font-bold text-green-700 text-sm truncate">${meal.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100 min-w-0">
                        <div className="p-1.5 rounded bg-orange-100 flex-shrink-0">
                          <Flame className="h-4 w-4 text-orange-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground truncate">{t('providerMeals.calories')}</p>
                          <p className="font-bold text-orange-700 text-sm truncate">{meal.calories}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Stack on mobile */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:flex-1 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
                          onClick={() => handleEditMeal(meal)}
                        >
                          <Edit2 className="h-3.5 w-3.5 me-1.5 flex-shrink-0" />
                          <span className="truncate">{t('providerMeals.edit')}</span>
                        </Button>
                        <Button
                          variant={meal.is_available ? 'outline' : 'default'}
                          size="sm"
                          className={`w-full sm:flex-1 transition-colors ${
                            meal.is_available
                              ? 'hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          onClick={() => handleToggleAvailability(meal)}
                        >
                          <Power className="h-3.5 w-3.5 me-1.5 flex-shrink-0" />
                          <span className="truncate">{meal.is_available ? t('providerMeals.disable') : t('providerMeals.enable')}</span>
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                        onClick={() => handleDeleteMeal(meal)}
                      >
                        <Trash2 className="h-3.5 w-3.5 me-1.5 flex-shrink-0" />
                        <span className="truncate">{t('providerMeals.delete')}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Meal Form Dialog */}
        <MealFormDialog
          open={showMealDialog}
          onClose={handleCloseDialog}
          meal={selectedMeal}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, meal: null })}
          onConfirm={confirmDeleteMeal}
          title={t('providerMeals.deleteMeal')}
          description={t('providerMeals.deleteMealConfirmation', { name: deleteDialog.meal?.name || '' })}
          confirmLabel={t('providerMeals.delete')}
          cancelLabel={t('common.cancel')}
          variant="destructive"
          loading={deletingMeal}
        />
      </div>
    </Layout>
  );
};

export default ProviderMeals;
