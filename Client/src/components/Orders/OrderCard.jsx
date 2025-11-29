import { useState } from "react";

export default function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    delivered: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    canceled: "bg-red-100 text-red-700",
  };

  return (
    <div
      className="bg-white p-6 rounded-xl border shadow mb-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top row */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Order {order.id}</h3>

        <span
          className={`px-4 py-1 rounded-full text-sm ${
            statusColors[order.status]
          }`}
        >
          {order.status.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-600 mt-1">Date: {order.date}</p>
      <p className="text-gray-700 font-medium mt-1">
        ${order.total.toFixed(2)}
      </p>

      {/* Expand area */}
      {expanded && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold mb-2">Items</h4>

          <ul className="text-sm space-y-1">
            {order.items.map((item, i) => (
              <li key={i}>
                • {item.name} <span className="text-gray-500">x{item.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
