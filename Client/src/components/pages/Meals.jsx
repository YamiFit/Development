import Layout from "../layout/Layout";
import { useState } from "react";
import { mealsData } from "../../data/meals";
import { useDispatch } from "react-redux";
import { openAddMeal } from "../store/uiSlice";

export default function Meals() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const dispatch = useDispatch();

  const filters = ["All", "Breakfast", "Lunch", "Dinner", "Snack"];

  const filteredMeals = mealsData.filter((meal) => {
    const matchesFilter = filter === "All" || meal.type === filter;
    const matchesSearch = meal.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Meals</h1>
        <button
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
          onClick={() => dispatch(openAddMeal())}
        >
          + Add Meal
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search meals..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full border transition-all font-medium ${
              filter === f
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Meals List */}
      <div className="grid grid-cols-3 gap-6">
        {filteredMeals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white shadow-sm p-5 rounded-xl border hover:shadow-md transition-shadow"
          >
            <div className="h-32 bg-linear-to-br from-green-100 to-green-200 rounded-lg mb-4"></div>

            <h3 className="font-semibold text-lg">{meal.name}</h3>
            <p className="text-gray-500 text-sm mb-3">{meal.type}</p>

            <div className="grid grid-cols-3 gap-2 text-sm mb-4 text-gray-600">
              <p>
                <span className="font-semibold text-gray-800">
                  {meal.calories}
                </span>{" "}
                kcal
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  {meal.protein}
                </span>
                g pro
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  {meal.carbs}
                </span>
                g carbs
              </p>
            </div>

            <button className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Add to Log
            </button>
          </div>
        ))}

        {filteredMeals.length === 0 && (
          <p className="text-gray-500 col-span-3 text-center mt-10">
            No meals found.
          </p>
        )}
      </div>
    </Layout>
  );
}
