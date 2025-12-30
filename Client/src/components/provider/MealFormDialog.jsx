/**
 * MealFormDialog Component
 * Dialog for creating and editing meals
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUpload from '../shared/ImageUpload';
import IngredientsInput from '../shared/IngredientsInput';
import { addMeal, updateMeal } from '@/store/slices/mealsSlice';
import { selectProviderProfile } from '@/store/selectors';
import { createMeal, updateMeal as updateMealService, uploadMealImage } from '@/services/api/meals.service';
import { MEAL_CATEGORIES } from '@/config/provider.constants';
import { useToast } from '@/hooks/use-toast';

const MEAL_FORM_DEFAULTS = {
  name: '',
  description: '',
  category: '',
  price: '',
  preparation_time_minutes: '',
  ingredients: [],
  is_available: true,
};

const MealFormDialog = ({ open, onClose, meal = null }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { t } = useTranslation();
  const providerProfile = useSelector(selectProviderProfile);

  const isEditing = !!meal;

  // Form state
  const [formData, setFormData] = useState(MEAL_FORM_DEFAULTS);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);

  // Initialize form data when meal prop changes
  useEffect(() => {
    if (meal) {
      setFormData({
        name: meal.name || '',
        description: meal.description || '',
        category: meal.category || '',
        price: meal.price?.toString() || '',
        preparation_time_minutes: meal.preparation_time_minutes?.toString() || '',
        ingredients: meal.ingredients || [],
        is_available: meal.is_available ?? true,
      });
      setImageRemoved(false);
    } else {
      setFormData(MEAL_FORM_DEFAULTS);
      setImageFile(null);
      setImageError(null);
      setImageRemoved(false);
    }
  }, [meal]);

  // Handle input change
  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle image change
  const handleImageChange = (file, error) => {
    setImageFile(file);
    setImageError(error);

    // Track if image was removed (file is null and we're editing)
    if (file === null && isEditing && meal?.image_url) {
      setImageRemoved(true);
    } else if (file !== null) {
      setImageRemoved(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = t('mealFormDialog.mealNameRequired');
    }

    if (!formData.category) {
      errors.category = t('mealFormDialog.categoryRequired');
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = t('mealFormDialog.priceRequired');
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: t('mealFormDialog.validationError'),
        description: t('mealFormDialog.fixErrors'),
        variant: 'destructive',
      });
      return;
    }

    // Image is only required when creating a new meal
    if (!isEditing && !imageFile) {
      setImageError(t('mealFormDialog.uploadMealImage'));
      return;
    }

    // When editing, image can be removed (imageRemoved=true) or kept (neither imageFile nor imageRemoved)

    setSaving(true);

    try {
      // Prepare meal data
      const mealData = {
        provider_id: providerProfile.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        preparation_time_minutes: formData.preparation_time_minutes ? parseInt(formData.preparation_time_minutes) : null,
        ingredients: formData.ingredients.filter(ing => ing.trim()),
        is_available: formData.is_available,
      };

      if (isEditing) {
        let finalImageUrl = meal.image_url;

        // Handle image removal
        if (imageRemoved) {
          finalImageUrl = null;
        }
        // Handle new image upload
        else if (imageFile) {
          const { data: uploadData, error: uploadError } = await uploadMealImage(meal.id, imageFile);
          if (uploadError) throw uploadError;
          finalImageUrl = uploadData.url;
        }

        // Update existing meal
        const { data: updatedMeal, error: updateError } = await updateMealService(
          meal.id,
          {
            ...mealData,
            image_url: finalImageUrl,
          }
        );

        if (updateError) throw updateError;

        // Update Redux state
        dispatch(updateMeal(updatedMeal));

        toast({
          title: t('common.success'),
          description: t('mealFormDialog.mealUpdated'),
        });
      } else {
        // Create new meal
        const { data: newMeal, error: createError } = await createMeal(mealData);

        if (createError) throw createError;

        // Upload image
        const { data: uploadData, error: uploadError } = await uploadMealImage(newMeal.id, imageFile);

        if (uploadError) throw uploadError;

        // Add to Redux state with updated image URL
        dispatch(addMeal({ ...newMeal, image_url: uploadData.url }));

        toast({
          title: t('common.success'),
          description: t('mealFormDialog.mealCreated'),
        });
      }

      // Close dialog
      onClose();
    } catch (err) {
      console.error('Error saving meal:', err);
      toast({
        title: t('common.error'),
        description: err.message || t('mealFormDialog.failedToSaveMeal'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('mealFormDialog.editMeal') : t('mealFormDialog.addNewMeal')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('mealFormDialog.updateMealInfo') : t('mealFormDialog.createNewOffering')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>{t('mealFormDialog.mealImage')} {!isEditing && <span className="text-red-500">*</span>}</Label>
            <ImageUpload
              value={meal?.image_url}
              onChange={handleImageChange}
              error={imageError}
            />
          </div>

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('mealFormDialog.mealName')} <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('mealFormDialog.mealNamePlaceholder')}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('mealFormDialog.category')} <span className="text-red-500">*</span></Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('mealFormDialog.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t('mealFormDialog.priceUSD')} <span className="text-red-500">*</span></Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="9.99"
                className={formErrors.price ? 'border-red-500' : ''}
              />
              {formErrors.price && <p className="text-sm text-red-500">{formErrors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparation_time_minutes">{t('mealFormDialog.prepTime')}</Label>
              <Input
                id="preparation_time_minutes"
                type="number"
                min="0"
                value={formData.preparation_time_minutes}
                onChange={(e) => handleChange('preparation_time_minutes', e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">{t('mealFormDialog.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('mealFormDialog.descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>{t('mealFormDialog.ingredients')}</Label>
            <IngredientsInput
              value={formData.ingredients}
              onChange={(value) => handleChange('ingredients', value)}
            />
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) => handleChange('is_available', checked)}
            />
            <Label htmlFor="is_available" className="cursor-pointer">
              {t('mealFormDialog.availableForOrder')}
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.saving') : isEditing ? t('mealFormDialog.updateMeal') : t('mealFormDialog.createMeal')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MealFormDialog;
