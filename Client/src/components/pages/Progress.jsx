import Layout from "../layout/Layout";
import WeeklyCalories from "../Charts/WeeklyCalories";
import WeightChart from "../Charts/WeightChart";
import MacrosPie from "../Charts/MacrosPie";

import { weeklyCalories, monthlyWeight, macrosPercent } from "../../data/progress";

import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Progress() {
  const [tab, setTab] = useState("week");
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('progress.title')}</h1>

        <div className="flex gap-3">
          <button
            onClick={() => setTab("week")}
            className={`px-5 py-2 rounded-lg border font-medium transition-colors ${
              tab === "week"
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t('progress.weekly')}
          </button>

          <button
            onClick={() => setTab("month")}
            className={`px-5 py-2 rounded-lg border font-medium transition-colors ${
              tab === "month"
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t('progress.monthly')}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Line Chart */}
        <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">
            {tab === "week" ? t('progress.weeklyCalories') : t('progress.monthlyWeight')}
          </h2>

          {tab === "week" ? (
            <WeeklyCalories data={weeklyCalories} />
          ) : (
            <WeightChart data={monthlyWeight} />
          )}
        </div>

        {/* Right: Macros Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">{t('progress.macrosBreakdown')}</h2>
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
      <h2 className="text-xl font-semibold mt-10 mb-4">{t('progress.yourGoals')}</h2>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-semibold text-lg">{t('progress.calorieGoal')}</h3>
          <p className="text-gray-600">2,000 {t('common.kcalPerDay')}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-semibold text-lg">{t('progress.proteinGoal')}</h3>
          <p className="text-gray-600">150g / {t('common.day')}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="font-semibold text-lg">{t('progress.weightGoal')}</h3>
          <p className="text-gray-600">75 {t('common.kg')}</p>
        </div>
      </div>
    </Layout>
  );
}
