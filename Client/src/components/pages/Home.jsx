import Layout from "../layout/Layout";
import CaloriesDonut from "../Charts/CaloriesDonut";
import WeeklyLine from "../Charts/WeeklyLine";
import { weeklyCalories, recommendedMeals } from "../../data/home";

export default function Home() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-800">Welcome back!</h1>
      <p className="text-gray-600 mb-6">
        Here's your nutrition overview for today
      </p>

      {/* Top cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-sm p-6 rounded-xl border hover:shadow-md transition-shadow cursor-pointer">
          <h2 className="font-semibold mb-2 text-lg">Add Meal</h2>
          <p className="text-sm text-gray-500">Log your nutrition</p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl border hover:shadow-md transition-shadow cursor-pointer">
          <h2 className="font-semibold mb-2 text-lg">Chat with Coach</h2>
          <p className="text-sm text-gray-500">Get guidance</p>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl border hover:shadow-md transition-shadow cursor-pointer">
          <h2 className="font-semibold mb-2 text-lg">Subscription</h2>
          <p className="text-sm text-gray-500">Manage your plan</p>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Daily Calories */}
        <div className="bg-white shadow-sm p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">Daily Calories</h2>
          <CaloriesDonut calories={0} goal={2000} />
        </div>

        {/* Weekly Progress */}
        <div className="col-span-2 bg-white shadow-sm p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">Weekly Progress</h2>
          <WeeklyLine data={weeklyCalories} />
        </div>
      </div>

      {/* Recommended Meals */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Recommended Meals</h2>
      <div className="grid grid-cols-3 gap-6">
        {recommendedMeals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white shadow-sm rounded-xl p-4 border hover:shadow-md transition-shadow"
          >
            <div className="h-32 bg-linear-to-br from-green-100 to-green-200 rounded-lg mb-4" />
            <h3 className="font-semibold">{meal.name}</h3>
            <p className="text-gray-500 text-sm">{meal.calories} kcal</p>
            <p className="text-gray-500 text-sm">{meal.protein}g protein</p>

            <button className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Add to Log
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
