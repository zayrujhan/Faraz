import { useEffect, useState } from 'react'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, formatPrice, formatDate, getToken } from '../lib/api'
import { productImage } from '../lib/images'

const statusClass = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('Loading orders...')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!getToken()) { window.location.hash = '#/login'; return }
    api('/orders/').then(data => { setOrders(data); setStatus('') }).catch(err => setStatus(err.message))
  }, [])

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return <div className="min-h-screen bg-gray-50"><Navbar />
    <main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6">
      <h1 className="text-2xl font-semibold text-gray-700 mb-2 flex items-center gap-2"><Package className="w-6 h-6" /> My Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Track and review your orders.</p>

      {status ? <p className="text-gray-600">{status}</p> : orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders yet. <a href="#/shop" className="underline text-gray-700">Start shopping</a></p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => toggle(order.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 text-left">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700">Order #{order.id}</span>
                  <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusClass[order.status?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{formatPrice(order.total_amount)}</span>
                  {expanded[order.id] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>
              {expanded[order.id] && (
                <div className="p-4 border-t border-gray-200">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex gap-4 mb-4 last:mb-0">
                      <img src={productImage(item.product, 80, 80)} alt="" className="w-16 h-16 rounded object-cover bg-gray-100" onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=No+Image' }} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-700">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">{formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}</p>
                        <p className="text-xs mt-1"><span className={`inline-block px-2 py-0.5 rounded capitalize ${statusClass[item.status?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>{item.status}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
    <Footer />
  </div>
}
