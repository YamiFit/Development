import Layout from "../layout/Layout";
import { useState } from "react";
import { currentSubscription, availablePlans } from "../../data/subscription";
import PlanCard from "../Subscription/PlanCard";

export default function Subscriptions() {
  const [selected, setSelected] = useState(currentSubscription.plan);

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Subscription & Billing
      </h1>

      {/* Current Plan */}
      <div className="bg-white border shadow-sm rounded-xl p-6 mb-10">
        <h2 className="text-xl font-semibold">Current Plan</h2>
        <p className="text-gray-600 mt-1">
          You are subscribed to:
          <span className="font-semibold"> {currentSubscription.plan}</span>
        </p>

        <p className="text-gray-600 mt-1">
          Renewal Date:
          <span className="font-semibold">
            {" "}
            {currentSubscription.renewDate}
          </span>
        </p>

        <span
          className={`inline-block mt-3 px-4 py-1 rounded-full text-sm ${
            currentSubscription.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {currentSubscription.status.toUpperCase()}
        </span>
      </div>

      {/* Plans */}
      <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {availablePlans.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            selected={selected === plan.name}
            onSelect={() => setSelected(plan.name)}
          />
        ))}
      </div>

      {/* Upgrade Button */}
      <button className="bg-green-600 text-white px-6 py-3 rounded-lg shadow text-lg">
        {selected === currentSubscription.plan
          ? "Your Current Plan"
          : `Switch to ${selected}`}
      </button>
    </Layout>
  );
}
