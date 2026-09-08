import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react'
import { api, buildQuery, formatPrice } from '../../lib/api'
import MetricCard from '../../components/ui/MetricCard'
import DataGrid from '../../components/ui/DataGrid'
import { SelectFilter } from '../../components/ui/FilterBar'

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api(`/seller/sales-summary${buildQuery({ days })}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />)}</div>
  if (!data) return null

  const maxDailyRevenue = Math.max(...data.daily_sales.map(d => d.revenue), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Sales performance for the last {days} days</p>
        </div>
        <SelectFilter
          value={days}
          onChange={(v) => setDays(Number(v))}
          options={[
            { value: 7, label: 'Last 7 days' },
            { value: 30, label: 'Last 30 days' },
            { value: 90, label: 'Last 90 days' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Revenue" value={formatPrice(data.revenue)} icon={DollarSign} />
        <MetricCard label="Orders" value={data.orders} icon={ShoppingCart} />
        <MetricCard label="Avg Order Value" value={formatPrice(data.average_order_value)} icon={TrendingUp} />
        <MetricCard label="Units Sold" value={data.units_sold} icon={Package} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Revenue</h2>
        {data.daily_sales.length === 0 ? (
          <p className="text-sm text-gray-500">No sales data for this period.</p>
        ) : (
          <div className="flex items-end gap-1 h-48">
            {data.daily_sales.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full bg-gray-900 rounded-t-sm min-h-[2px] transition-all hover:bg-gray-700"
                  style={{ height: `${(d.revenue / maxDailyRevenue) * 100}%` }}
                />
                <div className="hidden group-hover:block absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {d.date}: {formatPrice(d.revenue)}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">
                  {d.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.top_selling_products.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <DataGrid
            columns={[
              { key: 'product_name', label: 'Product', render: (r) => <span className="font-medium text-gray-900">{r.product_name}</span> },
              { key: 'units_sold', label: 'Units Sold', align: 'right' },
              { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => formatPrice(r.revenue) },
            ]}
            data={data.top_selling_products}
          />
        </div>
      )}
    </div>
  )
}
