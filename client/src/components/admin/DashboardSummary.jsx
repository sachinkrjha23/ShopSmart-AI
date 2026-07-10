const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0)

const DashboardSummary = ({ stats }) => {
  const topProduct = stats.topSellingProducts?.[0]
  const growthText =
    stats.revenueGrowth === 'New'
      ? 'First month with real sales!'
      : stats.revenueGrowth
      ? `Revenue ${stats.revenueGrowth.startsWith('-') ? 'down' : 'up'} ${stats.revenueGrowth.replace('-', '')} compared to last month`
      : 'Not enough data yet to compare'

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Summary</h2>
      <p className="text-xs text-gray-400 mb-4">Key metrics for the current month</p>

      <div className="flex flex-col gap-4 text-sm">
        <div>
          <p className="font-medium text-gray-800">Total Sales This Month</p>
          <p className="text-gray-500">{formatCurrency(stats.currentMonthSales)}</p>
        </div>

        <div>
          <p className="font-medium text-gray-800">Total Orders Placed</p>
          <p className="text-gray-500">{stats.totalOrdersPlaced ?? 0} orders</p>
        </div>

        <div>
          <p className="font-medium text-gray-800">Top Selling Product</p>
          <p className="text-gray-500">
            {topProduct ? `${topProduct.name} (${topProduct.total_sold} sold)` : 'No sales yet'}
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-800">Low Stock Alerts</p>
          <p className="text-gray-500">
            {stats.lowStockProducts?.length || 0} product(s) running low on stock
          </p>
        </div>

        <div>
          <p className="font-medium text-gray-800">Revenue Growth Rate</p>
          <p className="text-gray-500">{growthText}</p>
        </div>

        <div>
          <p className="font-medium text-gray-800">New Customers This Month</p>
          <p className="text-gray-500">{stats.newUsersThisMonth} new customer(s)</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardSummary