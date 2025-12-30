/**
 * IngredientsInput Component
 * Dynamic array input for meal ingredients
 */

import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const IngredientsInput = ({
  value = [],
  onChange,
  error,
  className = ''
}) => {
  const { t } = useTranslation();

  // Add new ingredient
  const handleAdd = () => {
    onChange([...value, '']);
  };

  // Remove ingredient at index
  const handleRemove = (index) => {
    const newIngredients = value.filter((_, i) => i !== index);
    onChange(newIngredients);
  };

  // Update ingredient at index
  const handleChange = (index, newValue) => {
    const newIngredients = [...value];
    newIngredients[index] = newValue;
    onChange(newIngredients);
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        {value.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
            {t('ingredientsInput.noIngredientsYet')}
          </div>
        ) : (
          value.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={ingredient}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={`${t('ingredientsInput.ingredient')} ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="mt-3 w-full"
      >
        <Plus className="h-4 w-4 me-2" />
        {t('ingredientsInput.addIngredient')}
      </Button>

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
};

export default IngredientsInput;
