import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, ShoppingBag, Truck, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { api } from '../lib/api'

function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const [productData, categoryData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/products/?limit=8`, { signal: controller.signal }),
          api('/categories/', { signal: controller.signal }),
        ])
        if (!productData.ok) throw new Error('Unable to load products.')
        setProducts(await productData.json())
        setCategories(categoryData.slice(0, 6))
      } catch (err) {
        if (err.name !== 'AbortError') setError('Products could not be loaded.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1607082348824-92a827f8c576?auto=format&fit=crop&w=1600&q=80"
            alt="hero background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container-app py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> AI-powered product search
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Discover products you will love
            </h1>
            <p className="text-lg text-indigo-100 mb-8 leading-relaxed">
              Shop thousands of items from trusted sellers, track orders in real time, and get instant help from our AI assistant.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#/shop" className="inline-flex items-center gap-2 bg-white text-indigo-900 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition">
                Shop Now <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#/seller/login" className="inline-flex items-center gap-2 bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-600 transition border border-indigo-500">
                Start Selling
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="container-app py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm"><ShoppingBag className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Curated Sellers</p>
                <p className="text-xs text-gray-500">Verified marketplace partners</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm"><Truck className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Fast Fulfillment</p>
                <p className="text-xs text-gray-500">Real-time order tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm"><ShieldCheck className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Secure Checkout</p>
                <p className="text-xs text-gray-500">Protected cart & orders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
          <a href="#/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#/shop?category=${cat.id}`}
              className="group flex flex-col items-center justify-center p-5 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition text-center"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition">
                <span className="text-indigo-700 font-bold text-lg">{cat.name.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{cat.name}</span>
            </a>
          ))}
          {categories.length === 0 && !isLoading && (
            <p className="col-span-full text-sm text-gray-500">No categories yet.</p>
          )}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-gray-50 py-14">
        <div className="container-app">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <a href="#/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Shop all</a>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">No products are available yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-app py-14">
        <div className="bg-indigo-900 rounded-2xl p-8 md:p-12 text-center md:text-left relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Stay in the loop</h2>
              <p className="text-indigo-100">Get updates on new sellers, products, and exclusive deals.</p>
            </div>
            <form className="flex w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-l-lg text-sm w-full md:w-64 border-0 focus:ring-2 focus:ring-indigo-400"
              />
              <button className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-5 py-3 rounded-r-lg text-sm transition">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomePage
