import { Search, ShoppingCart } from 'lucide-react'

function Navbar() {
    return (
      <nav className="flex items-center justify-between px-3 py-2 md:px-6 lg:px-12 bg-white">
        <div className="flex items-center">
            <img src="" alt="Logo:" />
        </div>
        <div className="flex items-center border border-gray-400 rounded-full px-3 py-1 w-40 md:w-48 lg:w-56">
            <Search className="w-4 h-4 text-gray-400 mr-1" />
            <input type="text" placeholder="Search..." className="outline-none px-1 text-sm w-full placeholder:text-gray-400" />
        </div>
        <div className = "hidden md:flex items-center space-x-4">
            <a href="#" className="pr-4 border-r border-gray-400">Home</a>
            <a href="#" className="pr-4 border-r border-gray-400">About</a>
            <a href="#" className="pr-4 border-r border-gray-400">Shop</a>
            <a href="#">Help</a>
        </div>
        <div className = "flex items-center ">
            <button className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-md"><ShoppingCart className="w-4 h-4 mr-2" />Your Cart</button>

        </div>
      </nav>  
    )
}

export default Navbar