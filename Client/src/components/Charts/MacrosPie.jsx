import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#2196f3", "#4caf50", "#ff9800"];

export default function MacrosPie({ data }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
