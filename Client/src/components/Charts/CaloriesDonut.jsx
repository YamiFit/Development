import { PieChart, Pie, Cell } from "recharts";

export default function CaloriesDonut({ calories, goal }) {
  const remaining = goal - calories;

  const data = [
    { name: "Consumed", value: calories },
    { name: "Remaining", value: remaining },
  ];

  const COLORS = ["#4caf50", "#e5e7eb"];

  return (
    <div style={{ width: "100%", height: 260 }}>
      <PieChart width={260} height={260}>
        <Pie
          data={data}
          cx={130}
          cy={130}
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
      </PieChart>
      <p className="text-center text-gray-700 mt-2">
        {remaining} kcal remaining
      </p>
    </div>
  );
}
