import { useDispatch, useSelector } from "react-redux";
import { closeAddMeal } from "@/store/slices/uiSlice";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AddMealModal() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const open = useSelector((state) => state.ui.addMealOpen);

  const [meal, setMeal] = useState({
    name: "",
    type: "Breakfast",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Meal added:", meal);
    dispatch(closeAddMeal());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-card text-card-foreground w-[500px] max-w-[95vw] rounded-2xl shadow-2xl p-8 animate-fadeIn max-h-[90vh] overflow-y-auto border border-border">
        <h2 className="text-2xl font-bold mb-6">{t('addMealModal.addNewMeal')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            placeholder={t('addMealModal.mealName')}
            value={meal.name}
            onChange={(e) => setMeal({ ...meal, name: e.target.value })}
            className="w-full border border-input bg-background text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            required
          />

          {/* Type */}
          <select
            value={meal.type}
            onChange={(e) => setMeal({ ...meal, type: e.target.value })}
            className="w-full border border-input bg-background text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option>{t('addMealModal.breakfast')}</option>
            <option>{t('addMealModal.lunch')}</option>
            <option>{t('addMealModal.dinner')}</option>
            <option>{t('addMealModal.snack')}</option>
          </select>

          {/* Macros */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder={t('addMealModal.calories')}
              value={meal.calories}
              onChange={(e) => setMeal({ ...meal, calories: e.target.value })}
              className="border border-input bg-background text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              required
            />
            <input
              type="number"
              placeholder={t('addMealModal.proteinG')}
              value={meal.protein}
              onChange={(e) => setMeal({ ...meal, protein: e.target.value })}
              className="border border-input bg-background text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            />
            <input
              type="number"
              placeholder={t('addMealModal.carbsG')}
              value={meal.carbs}
              onChange={(e) => setMeal({ ...meal, carbs: e.target.value })}
              className="border border-input bg-background text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            />
            <input
              type="number"
              placeholder={t('addMealModal.fatG')}
              value={meal.fat}
              onChange={(e) => setMeal({ ...meal, fat: e.target.value })}
              className="border border-input bg-background text-foreground px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeAddMeal())}
              className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {t('addMealModal.addMeal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
