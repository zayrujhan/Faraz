import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, Plus, Edit } from 'lucide-react'
import { api, formatPrice, formatDate } from '../../lib/api'
import { productImage } from '../../lib/images'
import MetricCard from '../../components/ui/MetricCard'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [products, setProducts] = useState([])
  const [productError, setProductError] = useState('')
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

    api('/seller/products?limit=100&include_inactive=true&sort=stock&order=asc', { signal: controller.signal })
      .then(setProducts)
      .catch((e) => {
        if (e.name !== 'AbortError') setProductError(e.message)
      })

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Products" value={data.total_products} icon={Package} />
        <MetricCard label="Active Products" value={data.active_products} icon={TrendingUp} />
        <MetricCard label="Pending Orders" value={data.pending_orders} icon={ShoppingCart} />
        <MetricCard label="Total Sales" value={formatPrice(data.total_sales)} icon={DollarSign} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Stock Alerts</h2>
          <Link to="/seller/products/new" className="flex items-center gap-1 text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700">
            <Plus className="w-3 h-3" /> Add product
          </Link>
        </div>

        {productError && <p className="text-sm text-red-600 mb-3">{productError}</p>}

        {products.length === 0 ? (
          <p className="text-sm text-gray-500">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter((p) => p.stock <= 10)
                  .sort((a, b) => a.stock - b.stock)
                  .map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage(p, 40, 40)}
                            alt=""
                            className="w-10 h-10 rounded object-cover bg-gray-100"
                            onError={(e) => { e.target.src = 'https://placehold.co/40x40?text=No+Image' }}
                          />
                          <div>
                            <p className="font-medium text-gray-700 line-clamp-1">{p.name}</p>
                            <p className="text-xs text-gray-500">{formatPrice(p.price)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-yellow-600' : 'text-gray-700'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {p.stock === 0 ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">Out of stock</span>
                        ) : p.stock <= 10 ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-700">Low stock</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">OK</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link to={`/seller/products/${p.id}`} className="inline-flex items-center gap-1 text-xs text-gray-700 underline hover:text-gray-900">
                          <Edit className="w-3 h-3" /> Edit / restock
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {products.filter((p) => p.stock <= 10).length === 0 && data.low_stock_products === 0 && data.out_of_stock_products === 0 && (
              <p className="text-sm text-gray-500 py-4">No low or out-of-stock products. Great job!</p>
            )}
          </div>
        )}
      </div>

      {(data.low_stock_products > 0 || data.out_of_stock_products > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.low_stock_products > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {data.low_stock_products} products low on stock
                </p>
                <Link to="/seller/products" className="text-xs text-yellow-600 underline">
                  View all products
                </Link>
              </div>
            </div>
          )}
          {data.out_of_stock_products > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {data.out_of_stock_products} products out of stock
                </p>
                <Link to="/seller/products" className="text-xs text-red-600 underline">
                  View all products
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/seller/orders" className="text-xs text-gray-500 hover:text-gray-700 underline">
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
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order #{order.order_id}</p>
                    <p className="text-xs text-gray-500">
                      {order.customer_name} &middot; {order.item_count} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatPrice(order.revenue)}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Best Selling Products</h2>
          {data.best_selling_products.length === 0 ? (
            <p className="text-sm text-gray-500">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.best_selling_products.map((p) => (
                <Link
                  key={p.product_id}
                  to={`/seller/products/${p.product_id}`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.product_name}</p>
                    <p className="text-xs text-gray-700 font-medium">{p.units_sold} units sold</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(p.revenue)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
