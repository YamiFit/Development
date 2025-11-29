export default function PlanCard({ plan, selected, onSelect }) {
  return (
    <div
      className={`p-6 border rounded-xl shadow cursor-pointer transition ${
        selected ? "border-green-600 bg-green-50" : "border-gray-300 bg-white"
      }`}
      onClick={onSelect}
    >
      <h2 className="text-xl font-semibold">{plan.name}</h2>
      <p className="text-green-700 font-bold text-2xl mt-2">
        {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
      </p>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {plan.features.map((f, i) => (
          <li key={i}>• {f}</li>
        ))}
      </ul>
    </div>
  );
}
