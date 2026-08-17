import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
function HomePage() {
    return (
        <>
            <Navbar />
            <section className="mx-6 md:mx-12 lg:mx-16 my-8 border border-gray-300 rounded-md 
                    min-h-[270px] flex flex-col items-center justify-center">
                <h1 className="text-2xl md:text-3xl font-medium text-gray-700">Tagline describing your e-shop</h1>
                <button className="bg-gray-700 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                    Shop Now
                </button>
            </section>

            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border border-gray-300 rounded-md py-8 px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-700"> Featured Products</h2>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   <ProductCard />
                   <ProductCard />
                   <ProductCard />
                   <ProductCard />
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