import { useEffect, useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function HomePage() {
    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [aiQuestion, setAiQuestion] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        async function loadProducts() {
            try {
                const response = await fetch(`${API_URL}/products/?limit=8`, {
                    signal: controller.signal,
                })
                if (!response.ok) throw new Error('Unable to load products.')
                setProducts(await response.json())
            } catch (err) {
                if (err.name !== 'AbortError') setError('Products could not be loaded. Please try again later.')
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }

        loadProducts()
        return () => controller.abort()
    }, [])

    function askAI(e) {
        e.preventDefault()
        const question = aiQuestion.trim() || 'Show me products'
        window.dispatchEvent(new CustomEvent('open-faraz-chat', { detail: { message: question } }))
        setAiQuestion('')
    }

    return (
        <>
            <Navbar />
            <section className="mx-6 md:mx-12 lg:mx-16 my-8 border border-gray-300 rounded-md
                    min-h-[270px] flex flex-col items-center justify-center text-center px-4">
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-3">
                    <Sparkles className="w-4 h-4" /> AI-Powered Shopping
                </div>
                <h1 className="text-2xl md:text-3xl font-medium text-gray-700">Find exactly what you need</h1>
                <p className="text-sm text-gray-500 mt-3 max-w-md">Search products, ask for recommendations, or get help with orders using the Faraz AI assistant.</p>
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <a href="#/shop" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded">
                        Shop Now
                    </a>
                    <button onClick={() => window.dispatchEvent(new CustomEvent('open-faraz-chat', { detail: { message: '' } }))} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded">
                        <Bot className="w-4 h-4" /> Ask AI
                    </button>
                </div>
            </section>

            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border border-indigo-100 bg-indigo-50/50 rounded-md py-8 px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Bot className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl md:text-2xl font-medium text-gray-700">Ask the Faraz Assistant</h2>
                </div>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
                    Looking for a product? Not sure about stock, shipping, or your order? Ask our AI assistant.
                </p>
                <form onSubmit={askAI} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
                    <input
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        type="text"
                        placeholder="e.g. Show me headphones under TK. 5000"
                        className="flex-1 w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-md text-sm">
                        <Bot className="w-4 h-4" /> Ask
                    </button>
                </form>
            </section>

            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border border-gray-300 rounded-md py-8 px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-700"> Featured Products</h2>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading && <p className="col-span-full text-gray-500">Loading products...</p>}
                    {error && <p className="col-span-full text-red-600">{error}</p>}
                    {!isLoading && !error && products.length === 0 && (
                        <p className="col-span-full text-gray-500">No products are available yet.</p>
                    )}
                    {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
            </section>
            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border-y border-gray-300 py-8 px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="md:w-1/2">
                        <h2 className="text-2xl md:text-3xl font-medium text-gray-700"> NewsLetter</h2>
                        <p className="mt-2 text-sm text-gray-500 max-w-md">Subscribe to our newsletter to stay updated with the latest products and offers.</p>
                    </div>
                <form className="flex w-full md:w-auto">
                        <input type="email" placeholder="Enter your email" className="border border-gray-400 rounded-l-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="bg-gray-700 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-r-md">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>
            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border border-gray-300 py-8 px-6 flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-700">About Your Shop</h2>

                <p className="mt-3 max-w-2xl mx-auto text-sm text-gray-500 text-center">
                   Faraz is a leading e-commerce platform offering a wide range of
                   products at competitive prices. You can trust us for the best
                shopping experience.
                </p>
            </section>
            <Footer />
        </>
    )
}

export default HomePage
