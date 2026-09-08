import { useCallback, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, formatPrice, getToken } from '../lib/api'

export default function ShoppingCart() {
  const [cart, setCart] = useState(null)
  const [status, setStatus] = useState('Loading cart...')
  const loadCart = useCallback(async () => {
    if (!getToken()) { setStatus('Please log in to view your cart.'); return }
    try { setStatus('Loading cart...'); setCart(await api('/cart/')); setStatus('') }
    catch (err) { setStatus(err.message) }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(loadCart, 0)
    return () => window.clearTimeout(timer)
  }, [loadCart])

  async function changeQuantity(item, quantity) {
    try { await api(`/cart/items/${item.id}?quantity=${quantity}`, { method: 'PUT' }); await loadCart() }
    catch (err) { setStatus(err.message) }
  }
  async function removeItem(itemId) {
    try { await api(`/cart/items/${itemId}`, { method: 'DELETE' }); await loadCart() }
    catch (err) { setStatus(err.message) }
  }

  const subtotal = cart?.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) || 0
  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6">
    <div className="grid grid-cols-3 border-b border-gray-200 mb-8 text-center text-xs"><div className="py-3 font-semibold text-gray-900 border-b-2 border-gray-900">1. Shopping Cart</div><div className="py-3 text-gray-400">2. Shipping Details</div><div className="py-3 text-gray-400">3. Payment Options</div></div>
    {status ? <div className="text-gray-600">{status} {!getToken() && <a className="underline font-medium" href="#/login">Login</a>}</div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-12"><section className="md:col-span-2"><h1 className="text-base font-bold text-gray-900 mb-6">Shopping Cart</h1>
      {cart.items.length === 0 ? <p className="text-sm text-gray-500">Your cart is empty. <a href="#/shop" className="underline">Browse products</a></p> : cart.items.map((item) => <article key={item.id} className="flex items-start justify-between pb-6 mb-6 border-b border-gray-100"><div><a href={`#/products/${item.product.id}`} className="text-sm font-bold text-gray-800">{item.product.name}</a><p className="text-xs text-gray-500 mt-1 max-w-sm">{item.product.description}</p><p className="text-sm font-bold text-gray-800 mt-3">{formatPrice(item.product.price)}</p><button onClick={() => removeItem(item.id)} className="mt-2 text-xs text-red-600 underline">Remove</button></div><select value={item.quantity} onChange={(e) => changeQuantity(item, Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">{Array.from({ length: Math.max(1, Math.min(item.product.stock, 10)) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} pcs</option>)}</select></article>)}</section>
      <aside><h2 className="text-base font-bold text-gray-900 mb-6">Summary</h2><div className="space-y-3 text-xs text-gray-600"><div className="flex justify-between"><span>SUBTOTAL</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>SHIPPING</span><span>Calculated at checkout</span></div></div><div className="border-t border-gray-200 my-4" /><div className="flex justify-between text-sm font-bold text-gray-900"><span>TOTAL</span><span>{formatPrice(subtotal)}</span></div></aside>
    </div>}
  </main><Footer /></div>
}
