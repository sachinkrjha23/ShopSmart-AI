import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const WINDOW_SIZE = 6;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm px-3 py-2 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-teal-600">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

const RevenueChart = ({ data, growth }) => {
  const hasData = data && data.length > 0;

  // Default to showing the most recent window (latest months first-load)
  const [startIndex, setStartIndex] = useState(
    hasData ? Math.max(0, data.length - WINDOW_SIZE) : 0,
  );

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Revenue
        </h2>
        <p className="text-sm text-gray-400">No sales data yet.</p>
      </div>
    );
  }

  const visibleData = data.slice(startIndex, startIndex + WINDOW_SIZE);
  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + WINDOW_SIZE < data.length;

  const handlePrev = () =>
    setStartIndex((prev) => Math.max(0, prev - WINDOW_SIZE));
  const handleNext = () =>
    setStartIndex((prev) =>
      Math.min(data.length - WINDOW_SIZE, prev + WINDOW_SIZE),
    );

  const rangeLabel =
    visibleData.length > 1
      ? `${visibleData[0].month} - ${visibleData[visibleData.length - 1].month}`
      : visibleData[0]?.month;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{rangeLabel}</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous months"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next months"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, "dataMax"]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
            <Bar
              dataKey="totalsales"
              fill="#4f46e5"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {growth && (
        <p className="text-xs text-gray-400 mt-2">
          This month vs last month:{" "}
          <span
            className={`font-semibold ${
              growth.startsWith("-") ? "text-red-500" : "text-green-600"
            }`}
          >
            {growth}
          </span>
        </p>
      )}
    </div>
  );
};

export default RevenueChart;
