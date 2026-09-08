import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, formatPrice, getToken } from '../lib/api'

export default function PaymentDetails() {
  const [cart, setCart] = useState(null)
  const [address, setAddress] = useState(null)
  const [shippingMethod, setShippingMethod] = useState(null)
  const [methods, setMethods] = useState([])
  const [selectedMethodId, setSelectedMethodId] = useState('')
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [status, setStatus] = useState('Loading payment details...')
  const [paying, setPaying] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)

  useEffect(() => {
    if (!getToken()) return
    const controller = new AbortController()
    async function load() {
      try {
        const [cartData, addresses, paymentMethods, shippingMethods] = await Promise.all([
          api('/cart/', { signal: controller.signal }), api('/addresses/', { signal: controller.signal }),
          api('/payment-methods/', { signal: controller.signal }), api('/shipping-methods/', { signal: controller.signal }),
        ])
        const savedAddress = addresses[0] || null
        const selectedShipping = shippingMethods.find((method) => method.id === savedAddress?.shipping_method_id) || null
        setCart(cartData); setAddress(savedAddress); setShippingMethod(selectedShipping); setMethods(paymentMethods)
        if (paymentMethods.length) setSelectedMethodId(paymentMethods[0].id)
        setStatus('')
      } catch (err) { if (err.name !== 'AbortError') setStatus(err.message) }
    }
    const timer = window.setTimeout(load, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])

  const selectedMethod = methods.find((method) => method.id === Number(selectedMethodId))
  const subtotal = cart?.items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0) || 0
  const shippingCost = Number(shippingMethod?.price || 0)
  const total = subtotal + shippingCost

  async function pay(event) {
    event.preventDefault()
    if (!address?.shipping_method_id) { setStatus('Please save a shipping address and shipping method first.'); return }
    if (selectedMethod?.requires_card_details && Object.values(card).some((value) => !value.trim())) { setStatus('Enter all card fields to continue.'); return }
    setPaying(true); setStatus('')
    try {
      const result = await api('/checkout/', { method: 'POST', body: JSON.stringify({ payment_method_id: Number(selectedMethodId) }) })
      setCompletedOrder(result.order)
      setCart({ ...cart, items: [] })
    } catch (err) { setStatus(err.message) } finally { setPaying(false) }
  }

  if (!getToken()) return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6 text-gray-600">Please <a href="#/login" className="underline font-medium">log in</a> to continue to payment.</main><Footer /></div>

  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6">
    <div className="grid grid-cols-3 border-b border-gray-200 mb-8 text-center text-xs"><a href="#/cart" className="py-3 text-gray-400 hover:text-gray-600">1. Shopping Cart</a><a href="#/shipping" className="py-3 text-gray-400 hover:text-gray-600">2. Shipping Details</a><div className="py-3 font-semibold text-gray-900 border-b-2 border-gray-900">3. Payment Options</div></div>
    {status === 'Loading payment details...' ? <p className="text-sm text-gray-500">{status}</p> : completedOrder ? <section className="text-center py-12"><h1 className="text-xl font-bold text-gray-900">Order placed</h1><p className="mt-3 text-sm text-gray-600">Order #{completedOrder.id} has been saved. Your {selectedMethod?.name} payment is pending confirmation.</p><a href="#/" className="inline-block mt-6 bg-slate-800 text-white text-xs font-semibold px-8 py-2 rounded">Continue shopping</a></section> : <div className="grid grid-cols-1 md:grid-cols-3 gap-12"><section className="md:col-span-2"><h1 className="text-base font-bold text-gray-900 mb-6">Payment method</h1>
      <form onSubmit={pay} className="space-y-4">{methods.map((method) => <label key={method.id} className={`block border rounded p-4 cursor-pointer ${Number(selectedMethodId) === method.id ? 'border-gray-700 bg-gray-50' : 'border-gray-300'}`}><div className="flex items-start gap-3"><input type="radio" name="payment_method" value={method.id} checked={Number(selectedMethodId) === method.id} onChange={(event) => setSelectedMethodId(event.target.value)} className="mt-1 accent-gray-800" /><span><span className="block text-sm font-semibold text-gray-800">{method.name}</span><span className="block text-xs text-gray-500 mt-1">{method.description}</span></span></div>{Number(selectedMethodId) === method.id && method.requires_card_details && <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 mt-5"><input value={card.number} onChange={(event) => setCard({ ...card, number: event.target.value })} placeholder="0000 0000 0000 0000" inputMode="numeric" className="sm:col-span-3 border border-gray-300 rounded px-3 py-2 text-sm" /><input value={card.expiry} onChange={(event) => setCard({ ...card, expiry: event.target.value })} placeholder="MM / YY" className="sm:col-span-1 border border-gray-300 rounded px-3 py-2 text-sm" /><input value={card.cvv} onChange={(event) => setCard({ ...card, cvv: event.target.value })} placeholder="CVV" inputMode="numeric" className="sm:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm" /><input value={card.name} onChange={(event) => setCard({ ...card, name: event.target.value })} placeholder="Card holder name" className="sm:col-span-6 border border-gray-300 rounded px-3 py-2 text-sm" /><p className="sm:col-span-6 text-xs text-gray-500">Card details are used only for this form validation and are never saved by Faraz.</p></div>}</label>)}
        {status && <p role="alert" className="text-sm text-red-600">{status}</p>}<div className="flex gap-3 pt-2"><button disabled={paying || !selectedMethodId || !cart?.items.length} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-8 py-2 rounded disabled:opacity-60">{paying ? 'Saving...' : 'Pay now'}</button><a href="#/shipping" className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-8 py-2 rounded">Cancel</a></div>
      </form></section>
      <aside><h2 className="text-base font-bold text-gray-900 mb-6">Summary</h2>{cart?.items.length === 0 && <p className="text-xs text-gray-500">Your cart is empty.</p>}{cart?.items.map((item) => <article key={item.id} className="pb-4 mb-4 border-b border-gray-100"><a href={`#/products/${item.product.id}`} className="text-xs font-bold text-gray-800 uppercase tracking-wide">{item.product.name}</a><p className="text-xs text-gray-500 mt-1">{item.quantity} pcs × {formatPrice(item.product.price)}</p></article>)}<div className="space-y-3 text-xs text-gray-600 mt-5"><div className="flex justify-between"><span>SUBTOTAL</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>SHIPPING</span><span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span></div></div><div className="border-t border-gray-200 my-4" /><div className="flex justify-between text-sm font-bold text-gray-900"><span>TOTAL</span><span>{formatPrice(total)}</span></div></aside>
    </div>}
  </main><Footer /></div>
}
