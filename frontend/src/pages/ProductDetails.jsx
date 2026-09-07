import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import { api, formatPrice, getToken } from '../lib/api'

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('Loading product...')
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setStatus('Loading product...')
      try {
        const data = await api(`/products/${productId}`, { signal: controller.signal })
        const [reviewData, similarData] = await Promise.all([
          api(`/reviews/${productId}`, { signal: controller.signal }),
          api(`/categories/${data.category_id}/products?limit=5`, { signal: controller.signal }),
        ])
        setProduct(data); setReviews(reviewData); setSimilar(similarData.filter((item) => item.id !== data.id).slice(0, 5)); setStatus('')
      } catch (err) { if (err.name !== 'AbortError') setStatus(err.message) }
    }
    load(); return () => controller.abort()
  }, [productId])

  async function addToCart() {
    if (!getToken()) { window.location.hash = '#/login'; return }
    setCartMessage('')
    try { await api('/cart/items', { method: 'POST', body: JSON.stringify({ product_id: product.id, quantity: 1 }) }); setCartMessage('Added to your cart.') }
    catch (err) { setCartMessage(err.message) }
  }

  if (status) return <><Navbar /><main className="p-10 text-gray-500">{status}</main></>
  return <div className="min-h-screen bg-white"><Navbar /><main className="px-6 md:px-10 lg:px-16 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"><div className="border border-gray-300 rounded-md h-[350px] flex items-center justify-center text-gray-400">No image available</div>
      <div><h1 className="text-2xl font-medium text-gray-700">{product.name}</h1><p className="mt-4 text-xl font-medium text-gray-700">{formatPrice(product.price)}</p><p className="mt-2 text-sm text-gray-500">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p><hr className="my-4 border-gray-200" /><h2 className="text-sm font-medium text-gray-600">Product details</h2><p className="text-sm text-gray-500 mt-3 leading-5">{product.description || 'No description has been added for this product.'}</p>
        <button disabled={product.stock < 1} onClick={addToCart} className="mt-6 bg-gray-700 hover:bg-gray-800 text-white text-sm px-6 py-2 rounded-md disabled:opacity-50">Add To Cart</button>{cartMessage && <p className="mt-3 text-sm text-gray-600">{cartMessage}</p>}
      </div></div>
  </main>
  <section className="border-y border-gray-200 py-6 px-6 md:px-10 lg:px-16"><h2 className="text-xl font-medium text-gray-700">Similar Products</h2><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mt-6">{similar.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
  <section className="px-6 md:px-10 lg:px-16 py-6"><h2 className="text-xl font-medium text-gray-700">Reviews</h2>{reviews.length === 0 ? <p className="mt-4 text-sm text-gray-500">There are no reviews yet.</p> : reviews.map((review) => <article key={review.id} className="border-b border-gray-100 py-4"><div className="flex items-center gap-1">{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`w-4 h-4 ${index < review.rating ? 'fill-gray-600 text-gray-600' : 'text-gray-300'}`} />)}</div><p className="mt-2 text-sm text-gray-600">{review.comment || 'No comment provided.'}</p></article>)}</section><Footer />
  </div>
}

export default ProductDetails
