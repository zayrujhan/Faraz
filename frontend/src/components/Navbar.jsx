import { Search, ShoppingCart } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../lib/api'

function Navbar() {
    const loggedIn = Boolean(getToken())
    const navigate = useNavigate()

    const submitSearch = (event) => {
      event.preventDefault()
      const search = new FormData(event.currentTarget).get('search')?.trim()
      navigate(`/shop${search ? `?search=${encodeURIComponent(search)}` : ''}`)
    }

    return (
      <nav className="flex items-center justify-between px-3 py-2 md:px-6 lg:px-12 bg-white">
        <div className="flex items-center">
            <Link to="/" className="text-xl font-semibold text-gray-800">Faraz</Link>
        </div>
        <form onSubmit={submitSearch} className="flex items-center border border-gray-400 rounded-full px-3 py-1 w-40 md:w-48 lg:w-56">
            <Search className="w-4 h-4 text-gray-400 mr-1" />
            <input name="search" type="text" placeholder="Search..." className="outline-none px-1 text-sm w-full placeholder:text-gray-400" />
        </form>
        <div className = "hidden md:flex items-center space-x-4">
            <Link to="/" className="pr-4 border-r border-gray-400">Home</Link>
            <a href="#" className="pr-4 border-r border-gray-400">About</a>
            <Link to="/shop" className="pr-4 border-r border-gray-400">Shop</Link>
            <a href="#">Help</a>
        </div>
        <div className = "flex items-center ">
            <Link to="/cart" className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-md"><ShoppingCart className="w-4 h-4 mr-2" />Your Cart</Link>
            {loggedIn ? (
              <button onClick={() => { clearToken(); navigate('/') }} className="ml-4 bg-gray-800 text-white px-4 py-2 rounded-md">Logout</button>
            ) : <Link to="/login" className="ml-4 bg-gray-800 text-white px-4 py-2 rounded-md">Login</Link>}
        </div>
      </nav>
    )
}

export default Navbar
