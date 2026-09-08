import { useCallback, useEffect, useState } from 'react'
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, formatPrice, getToken } from '../lib/api'
import { productImage } from '../lib/images'

export default function ShoppingCart() {
  const [cart, setCart] = useState(null)
  const [status, setStatus] = useState('Loading cart...')
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const loadCart = useCallback(async () => {
    if (!getToken()) { setStatus('Please log in to view your cart.'); return }
    try {
      setStatus('Loading cart...')
      const data = await api('/cart/')
      setCart(data)
      setStatus('')
    } catch (err) { setStatus(err.message) }
  }, [])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  async function changeQuantity(item, quantity) {
    if (quantity < 1) return
    try {
      await api(`/cart/items/${item.id}?quantity=${quantity}`, { method: 'PUT' })
      await loadCart()
    } catch (err) { setStatus(err.message) }
  }

  async function removeItem(itemId) {
    try {
      await api(`/cart/items/${itemId}`, { method: 'DELETE' })
      await loadCart()
    } catch (err) { setStatus(err.message) }
  }

  async function checkout() {
    if (!getToken()) { window.location.hash = '#/login'; return }
    setCheckingOut(true)
    setCheckoutError('')
    try {
      const order = await api('/orders/', { method: 'POST' })
      window.location.hash = `#/orders?highlight=${order.id}`
    } catch (err) {
      setCheckoutError(err.message)
      setCheckingOut(false)
    }
  }

  const subtotal = cart?.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) || 0
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  if (status) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="container-app py-16 flex-1">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600 mb-4">{status}</p>
            {!getToken() && (
              <a href="#/login" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700">
                Sign In to Continue
              </a>
            )}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="container-app py-10 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" /> Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <section className="lg:col-span-2 space-y-4">
            {cart.items.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                <p className="text-gray-500 mb-4">Your cart is empty.</p>
                <a href="#/shop" className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline">
                  Browse products <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              cart.items.map((item) => (
                <article key={item.id} className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4">
                  <img
                    src={productImage(item.product, 120, 120)}
                    alt={item.product.name}
                    className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                    onError={(e) => { e.target.src = 'https://placehold.co/120x120?text=No+Image' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <a href={`#/products/${item.product.id}`} className="font-semibold text-gray-900 hover:text-indigo-700 line-clamp-1">
                          {item.product.name}
                        </a>
                        <p className="text-sm text-gray-500 mt-0.5">{formatPrice(item.product.price)} each</p>
                      </div>
                      <p className="font-bold text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          disabled={item.quantity <= 1}
                          onClick={() => changeQuantity(item, item.quantity - 1)}
                          className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          disabled={item.quantity >= item.product.stock}
                          onClick={() => changeQuantity(item, item.quantity + 1)}
                          className="p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>

                    {item.quantity > item.product.stock && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Only {item.product.stock} available. Reduce quantity to checkout.
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>

          {/* Summary */}
          <aside>
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({itemCount})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  {checkoutError}
                </div>
              )}

              <button
                disabled={cart.items.length === 0 || checkingOut}
                onClick={checkout}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition"
              >
                {checkingOut ? 'Placing order...' : <>Checkout <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="mt-3 text-xs text-gray-500 text-center">
                Checkout uses your saved address. Add one in your account if needed.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
