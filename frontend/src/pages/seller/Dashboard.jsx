import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react'
import { api, formatPrice, formatDate } from '../../lib/api'
import MetricCard from '../../components/ui/MetricCard'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    api('/seller/dashboard', { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store performance</p>
        </div>
        <Link
          to="/seller/products/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          Add Product <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Products" value={data.total_products} icon={Package} trend={5} trendLabel="vs last month" />
        <MetricCard label="Active Products" value={data.active_products} icon={TrendingUp} />
        <MetricCard label="Pending Orders" value={data.pending_orders} icon={ShoppingCart} trend={-2} trendLabel="vs last week" />
        <MetricCard label="Total Sales" value={formatPrice(data.total_sales)} icon={DollarSign} trend={12} trendLabel="vs last month" />
      </div>

      {(data.low_stock_products > 0 || data.out_of_stock_products > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.low_stock_products > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  {data.low_stock_products} products low on stock
                </p>
                <Link to="/seller/products" className="text-xs text-yellow-700 hover:underline font-medium">
                  View products
                </Link>
              </div>
            </div>
          )}
          {data.out_of_stock_products > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {data.out_of_stock_products} products out of stock
                </p>
                <Link to="/seller/products" className="text-xs text-red-700 hover:underline font-medium">
                  View products
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Orders</h2>
            <Link to="/seller/orders" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </div>
          {data.recent_orders.length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders.</p>
          ) : (
            <div className="space-y-3">
              {data.recent_orders.map((order) => (
                <Link
                  key={order.order_id}
                  to={`/seller/orders/${order.order_id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Order #{order.order_id}</p>
                    <p className="text-xs text-gray-500">
                      {order.customer_name} &middot; {order.item_count} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(order.revenue)}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Best Selling Products</h2>
          {data.best_selling_products.length === 0 ? (
            <p className="text-sm text-gray-500">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.best_selling_products.map((p) => (
                <Link
                  key={p.product_id}
                  to={`/seller/products/${p.product_id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.product_name}</p>
                    <p className="text-xs text-gray-500">{p.units_sold} units sold</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(p.revenue)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
