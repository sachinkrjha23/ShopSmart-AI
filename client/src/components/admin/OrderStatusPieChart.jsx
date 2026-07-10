import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export const STATUS_COLORS = {
  Processing: "#3b82f6",
  Shipped: "#f59e0b",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

const OrderStatusPieChart = ({ counts }) => {
  const data = Object.entries(counts || {})
    .map(([status, value]) => ({ name: status, value }))
    .filter((entry) => entry.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="h-56 flex items-center justify-center">
        <p className="text-sm text-gray-400">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] || "#9ca3af"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderStatusPieChart;
