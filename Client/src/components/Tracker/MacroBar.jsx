export default function MacroBar({ label, value, goal, color }) {
  const percent = Math.min((value / goal) * 100, 100);

  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">
          {value} / {goal}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
}
