import { useDispatch, useSelector } from "react-redux";
import { closeAddMeal } from "../store/uiSlice";
import { useState } from "react";

export default function AddMealModal() {
  const dispatch = useDispatch();
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
      <div className="bg-white w-[500px] rounded-2xl shadow-2xl p-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Add New Meal</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            placeholder="Meal name"
            value={meal.name}
            onChange={(e) => setMeal({ ...meal, name: e.target.value })}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />

          {/* Type */}
          <select
            value={meal.type}
            onChange={(e) => setMeal({ ...meal, type: e.target.value })}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snack</option>
          </select>

          {/* Macros */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Calories"
              value={meal.calories}
              onChange={(e) => setMeal({ ...meal, calories: e.target.value })}
              className="border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <input
              type="number"
              placeholder="Protein (g)"
              value={meal.protein}
              onChange={(e) => setMeal({ ...meal, protein: e.target.value })}
              className="border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Carbs (g)"
              value={meal.carbs}
              onChange={(e) => setMeal({ ...meal, carbs: e.target.value })}
              className="border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Fat (g)"
              value={meal.fat}
              onChange={(e) => setMeal({ ...meal, fat: e.target.value })}
              className="border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeAddMeal())}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
