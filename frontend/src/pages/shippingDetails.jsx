import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, formatPrice, getToken } from '../lib/api'

const emptyAddress = { street: '', city: '', state: '', country: '', postal_code: '', shipping_method_id: '' }
const fieldClass = 'mt-2 w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400'

function ShippingDetails() {
  const [address, setAddress] = useState(emptyAddress)
  const [customer, setCustomer] = useState({ name: '', phone: '' })
  const [methods, setMethods] = useState([])
  const [cart, setCart] = useState(null)
  const [hasAddress, setHasAddress] = useState(false)
  const [status, setStatus] = useState('Loading shipping details...')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!getToken()) return
    const controller = new AbortController()
    async function load() {
      try {
        const [user, addresses, shippingMethods, cartData] = await Promise.all([
          api('/me', { signal: controller.signal }), api('/addresses/', { signal: controller.signal }),
          api('/shipping-methods/', { signal: controller.signal }), api('/cart/', { signal: controller.signal }),
        ])
        setCustomer({ name: user.name || '', phone: user.phone || '' })
        setMethods(shippingMethods); setCart(cartData)
        if (addresses.length) {
          const saved = addresses[0]
          setAddress({ street: saved.street, city: saved.city, state: saved.state, country: saved.country, postal_code: saved.postal_code, shipping_method_id: saved.shipping_method_id || '' })
          setHasAddress(true)
        } else if (shippingMethods.length) setAddress((current) => ({ ...current, shipping_method_id: shippingMethods[0].id }))
        setStatus('')
      } catch (err) { if (err.name !== 'AbortError') setStatus(err.message) }
    }
    const timer = window.setTimeout(load, 0)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [])

  const updateAddress = (event) => setAddress({ ...address, [event.target.name]: event.target.value })
  const updateCustomer = (event) => setCustomer({ ...customer, [event.target.name]: event.target.value })
  const [firstName, ...lastNameParts] = customer.name.split(' ')
  const lastName = lastNameParts.join(' ')
  const selectedMethod = methods.find((method) => method.id === Number(address.shipping_method_id))
  const subtotal = cart?.items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0) || 0
  const shippingCost = Number(selectedMethod?.price || 0)

  async function saveDetails(event) {
    event.preventDefault(); setSaving(true); setStatus('')
    try {
      const addressPayload = { ...address, shipping_method_id: Number(address.shipping_method_id) }
      await Promise.all([api('/users/', { method: 'PUT', body: JSON.stringify(customer) }), api(hasAddress ? '/addresses/update' : '/addresses/', { method: 'POST', body: JSON.stringify(addressPayload) })])
      setHasAddress(true)
      window.location.hash = '#/payment'
    } catch (err) { setStatus(err.message) } finally { setSaving(false) }
  }

  if (!getToken()) return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6 text-gray-600">Please <a href="#/login" className="underline font-medium">log in</a> to continue to shipping details.</main><Footer /></div>

  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="max-w-5xl mx-auto bg-white border border-gray-200 p-6 md:p-10 shadow-sm mt-6">
    <div className="grid grid-cols-3 border-b border-gray-200 mb-8 text-center text-xs"><a href="#/cart" className="py-3 text-gray-400 hover:text-gray-600">1. Shopping Cart</a><div className="py-3 font-semibold text-gray-900 border-b-2 border-gray-900">2. Shipping Details</div><div className="py-3 text-gray-400">3. Payment Options</div></div>
    {status === 'Loading shipping details...' ? <p className="text-sm text-gray-500">{status}</p> : <div className="grid grid-cols-1 md:grid-cols-3 gap-12"><section className="md:col-span-2"><h1 className="text-base font-bold text-gray-900 mb-6">Shipping Details</h1>
      <form onSubmit={saveDetails} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="text-xs font-medium text-gray-700">FIRST NAME<input required value={firstName} onChange={(event) => setCustomer({ ...customer, name: `${event.target.value} ${lastName}`.trim() })} className={fieldClass} /></label><label className="text-xs font-medium text-gray-700">LAST NAME<input value={lastName} onChange={(event) => setCustomer({ ...customer, name: `${firstName} ${event.target.value}`.trim() })} className={fieldClass} /></label></div>
        <label className="block text-xs font-medium text-gray-700">ADDRESS<input required name="street" value={address.street} onChange={updateAddress} className={fieldClass} /></label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="text-xs font-medium text-gray-700">COUNTRY<select required name="country" value={address.country} onChange={updateAddress} className={fieldClass}><option value="" disabled>Select country</option><option>Bangladesh</option><option>India</option><option>Pakistan</option><option>United States</option></select></label><label className="text-xs font-medium text-gray-700">CITY<input required name="city" value={address.city} onChange={updateAddress} className={fieldClass} /></label></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><label className="text-xs font-medium text-gray-700">STATE / DIVISION<input required name="state" value={address.state} onChange={updateAddress} className={fieldClass} /></label><label className="text-xs font-medium text-gray-700">POSTAL CODE<input required name="postal_code" value={address.postal_code} onChange={updateAddress} className={fieldClass} /></label><label className="text-xs font-medium text-gray-700">PHONE<input name="phone" value={customer.phone || ''} onChange={updateCustomer} className={fieldClass} /></label></div>
        <div className="border-t border-gray-100 pt-5"><h2 className="text-sm font-bold text-gray-900 mb-4">Shipping method</h2><div className="space-y-3">{methods.map((method) => <label key={method.id} className={`flex items-center justify-between border rounded px-4 py-3 cursor-pointer ${Number(address.shipping_method_id) === method.id ? 'border-gray-700 bg-gray-50' : 'border-gray-300'}`}><span className="flex items-center gap-3"><input required type="radio" name="shipping_method_id" value={method.id} checked={Number(address.shipping_method_id) === method.id} onChange={updateAddress} className="accent-gray-800" /><span><span className="block text-sm font-medium text-gray-800">{method.name}</span><span className="block text-xs text-gray-500 mt-1">{method.delivery_estimate}</span></span></span><span className="text-sm font-semibold text-gray-800">{method.price === 0 ? 'FREE' : formatPrice(method.price)}</span></label>)}</div></div>
        {status && <p role="status" className="text-sm text-gray-600">{status}</p>}
        <div className="flex items-center gap-3 pt-2"><button disabled={saving || methods.length === 0} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-8 py-2 rounded transition disabled:opacity-60">{saving ? 'Saving...' : 'Save and continue'}</button><a href="#/cart" className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-8 py-2 rounded transition">Back to cart</a></div>
      </form></section>
      <aside><h2 className="text-base font-bold text-gray-900 mb-6">Summary</h2>{cart?.items.length === 0 && <p className="text-xs text-gray-500">Your cart is empty.</p>}{cart?.items.map((item) => <article key={item.id} className="pb-4 mb-4 border-b border-gray-100"><a href={`#/products/${item.product.id}`} className="text-xs font-bold text-gray-800 uppercase tracking-wide">{item.product.name}</a><p className="text-xs text-gray-500 mt-1">{item.quantity} pcs × {formatPrice(item.product.price)}</p></article>)}<div className="space-y-3 text-xs text-gray-600 mt-5"><div className="flex justify-between"><span>SUBTOTAL</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between"><span>SHIPPING</span><span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span></div></div><div className="border-t border-gray-200 my-4" /><div className="flex justify-between text-sm font-bold text-gray-900"><span>TOTAL</span><span>{formatPrice(subtotal + shippingCost)}</span></div></aside>
    </div>}
  </main><Footer /></div>
}

export default ShippingDetails
