import { useEffect, useState } from 'react'
import { Star, ShoppingCart, Minus, Plus, MessageCircle, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { api, formatPrice, getToken } from '../lib/api'
import { productImage } from '../lib/images'

function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('Loading product...')
  const [cartMessage, setCartMessage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewStatus, setReviewStatus] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setStatus('Loading product...')
      setCartMessage('')
      try {
        const data = await api(`/products/${productId}`, { signal: controller.signal })
        const [reviewData, similarData] = await Promise.all([
          api(`/reviews/${productId}`, { signal: controller.signal }),
          api(`/categories/${data.category_id}/products?limit=8`, { signal: controller.signal }),
        ])
        setProduct(data)
        setReviews(reviewData)
        setSimilar(similarData.filter((item) => item.id !== data.id).slice(0, 4))
        setQuantity(1)
        setStatus('')
      } catch (err) {
        if (err.name !== 'AbortError') setStatus(err.message)
      }
    }
    load()
    return () => controller.abort()
  }, [productId])

  async function addToCart() {
    if (!getToken()) { window.location.hash = '#/login'; return }
    setCartMessage('')
    try {
      await api('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity }),
      })
      setCartMessage(`Added ${quantity} to cart.`)
    } catch (err) {
      setCartMessage(err.message)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!getToken()) { window.location.hash = '#/login'; return }
    setReviewStatus('')
    try {
      await api('/reviews/', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, ...reviewForm }),
      })
      setReviewStatus('Review posted!')
      setReviewForm({ rating: 5, comment: '' })
      const reviewData = await api(`/reviews/${productId}`)
      setReviews(reviewData)
    } catch (err) {
      setReviewStatus(err.message)
    }
  }

  if (status) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container-app py-16 text-center">
          <p className="text-gray-500">{status}</p>
        </main>
      </div>
    )
  }

  const image = productImage(product, 600, 600)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container-app py-8">
        <a href="#/shop" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div className="aspect-square rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden">
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://placehold.co/600x600?text=No+Image' }}
            />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-indigo-600">{product.category?.name || 'Shop'}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <p className="mt-6 text-gray-600 leading-relaxed">
              {product.description || 'No description has been added for this product.'}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => q - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <button
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                disabled={product.stock < 1}
                onClick={addToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
            </div>
            {cartMessage && (
              <p className={`mt-3 text-sm ${cartMessage.includes('stock') || cartMessage.includes('available') ? 'text-red-600' : 'text-green-600'}`}>
                {cartMessage}
              </p>
            )}

            {/* AI recommendation hint */}
            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Need help choosing?</p>
                  <p className="text-sm text-indigo-700 mt-1">
                    Ask the Faraz AI assistant for recommendations or product comparisons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet. Be the first to review this product.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{review.comment || 'No comment provided.'}</p>
                  <p className="mt-2 text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {getToken() && (
            <form onSubmit={submitReview} className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-200 max-w-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Write a review</h3>
              <label className="block text-sm text-gray-600 mb-1">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="mb-3 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} star{r > 1 && 's'}</option>)}
              </select>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
              />
              <button type="submit" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-700">
                Submit Review
              </button>
              {reviewStatus && <p className="mt-2 text-sm text-gray-600">{reviewStatus}</p>}
            </form>
          )}
        </section>

        {/* Similar products */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {similar.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default ProductDetails
