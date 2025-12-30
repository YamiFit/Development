import Layout from "../layout/Layout";
import { todayMeals } from "../../data/tracker";
import MacroBar from "../Tracker/MacroBar";
import { useDispatch } from "react-redux";
import { openAddMeal } from "@/store/slices/uiSlice";
import { useTranslation } from "react-i18next";

export default function Tracker() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Calculate totals
  const totals = todayMeals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fat += meal.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 60,
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('tracker.title')}</h1>

        <button
          onClick={() => dispatch(openAddMeal())}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
        >
          + {t('tracker.addMeal')}
        </button>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-white shadow-sm p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">{t('tracker.todaysIntake')}</h2>

          <div className="space-y-4">
            <MacroBar
              label={t('tracker.calories')}
              value={totals.calories}
              goal={goals.calories}
              color="#4caf50"
            />
            <MacroBar
              label={t('tracker.protein')}
              value={totals.protein}
              goal={goals.protein}
              color="#2196f3"
            />
            <MacroBar
              label={t('tracker.carbs')}
              value={totals.carbs}
              goal={goals.carbs}
              color="#ff9800"
            />
            <MacroBar
              label={t('tracker.fat')}
              value={totals.fat}
              goal={goals.fat}
              color="#e91e63"
            />
          </div>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">{t('tracker.quickStats')}</h2>

          <p className="mb-2 text-gray-700">
            {t('tracker.mealsLogged')}:{" "}
            <span className="font-semibold">{todayMeals.length}</span>
          </p>

          <p className="mb-2 text-gray-700">
            {t('tracker.caloriesRemaining')}:{" "}
            <span className="font-semibold">
              {goals.calories - totals.calories}
            </span>
          </p>

          <p className="text-gray-700">
            {t('tracker.proteinRemaining')}:{" "}
            <span className="font-semibold">
              {goals.protein - totals.protein}g
            </span>
          </p>
        </div>
      </div>

      {/* Meals List */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {t('tracker.mealsLoggedToday')}
      </h2>

      <div className="space-y-3">
        {todayMeals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white shadow-sm p-5 rounded-xl border flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <h3 className="font-semibold text-lg">{meal.name}</h3>
              <p className="text-gray-500">{meal.type}</p>
            </div>

            <div className="text-right">
              <p className="font-semibold">{meal.calories} {t('tracker.kcal')}</p>
              <p className="text-gray-500 text-sm">
                {meal.protein}P / {meal.carbs}C / {meal.fat}F
              </p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
