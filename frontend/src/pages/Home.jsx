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
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Shop Now
                </button>
            </section>
            <main>
                <ProductCard />
            </main>
            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border border-gray-300 rounded-md py-8 px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-700"> Featured Products</h2>
            </section>
            <section className="flex flex-col md:flex-row mx-6 md:mx-12 lg:mx-16 my-10 border border-gray-300 rounded-md py-8 px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-700"> NewsLetter</h2>
                <p className="mt-4 max-w-2xl mx-auto text-sm text-gray-500">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi.</p>
                <form className="mt-6 flex justify-center">
                    <input type="email" placeholder="Enter your email" className="border border-gray-400 rounded-l-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md">
                        Subscribe
                    </button>
                </form>
            </section>
            <section className="mx-6 md:mx-12 lg:mx-16 my-10 border border-gray-300 py-8 px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-medium text-gray-700"> About Your Shop</h2>

                 <p className="mt-4 max-w-2xl mx-auto text-sm text-gray-500">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi.</p>
            </section>
            <Footer />
        </>
    )
}

export default HomePage