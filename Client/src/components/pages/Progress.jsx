import Layout from "../layout/Layout";
import WeeklyCalories from "../Charts/WeeklyCalories";
import WeightChart from "../Charts/WeightChart";
import MacrosPie from "../Charts/MacrosPie";

import { weeklyCalories, monthlyWeight, macrosPercent } from "../../data/progress";

import { useState } from "react";

export default function Progress() {
  const [tab, setTab] = useState("week");

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Progress Overview</h1>

        <div className="flex gap-3">
          <button
            onClick={() => setTab("week")}
            className={`px-5 py-2 rounded-lg border font-medium transition-colors ${
              tab === "week"
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Weekly
          </button>

          <button
            onClick={() => setTab("month")}
            className={`px-5 py-2 rounded-lg border font-medium transition-colors ${
              tab === "month"
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Line Chart */}
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">
            {tab === "week" ? "Weekly Calories" : "Monthly Weight"}
          </h2>

          {tab === "week" ? (
            <WeeklyCalories data={weeklyCalories} />
          ) : (
            <WeightChart data={monthlyWeight} />
          )}
        </div>

        {/* Right: Macros Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Macros Breakdown</h2>
          <MacrosPie data={macrosPercent} />

          <div className="mt-4 space-y-2 text-sm">
            {macrosPercent.map((m, i) => (
              <p key={i}>
                <span className="font-semibold">{m.name}:</span> {m.value}%
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <h2 className="text-xl font-semibold mt-10 mb-4">Your Goals</h2>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-semibold text-lg">Calorie Goal</h3>
          <p className="text-gray-600">2,000 kcal / day</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-semibold text-lg">Protein Goal</h3>
          <p className="text-gray-600">150g / day</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-semibold text-lg">Weight Goal</h3>
          <p className="text-gray-600">75 kg</p>
        </div>
      </div>
    </Layout>
  );
}
