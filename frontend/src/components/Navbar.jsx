import { Search, ShoppingCart, User, Store, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logoUrl } from '../lib/images'

function Navbar() {
  const { user, logout, isSeller, isAdmin, isSellerOrAdmin } = useAuth()

  const submitSearch = (event) => {
    event.preventDefault()
    const search = new FormData(event.currentTarget).get('search')?.trim()
    window.location.hash = `#/shop${search ? `?search=${encodeURIComponent(search)}` : ''}`
  }

  return (
    <nav className="flex items-center justify-between px-3 py-2 md:px-6 lg:px-12 bg-white">
      <div className="flex items-center">
        <a href="#/" className="flex items-center gap-2">
          <img src={logoUrl()} alt="Faraz" className="h-8 object-contain" />
          <span className="text-xl font-semibold text-gray-800 hidden sm:inline">Faraz</span>
        </a>
      </div>
      <form onSubmit={submitSearch} className="flex items-center border border-gray-400 rounded-full px-3 py-1 w-40 md:w-48 lg:w-56">
        <Search className="w-4 h-4 text-gray-400 mr-1" />
        <input name="search" type="text" placeholder="Search..." className="outline-none px-1 text-sm w-full placeholder:text-gray-400" />
      </form>
      <div className="hidden md:flex items-center space-x-4">
        <a href="#/" className="pr-4 border-r border-gray-400">Home</a>
        <a href="#" className="pr-4 border-r border-gray-400">About</a>
        <a href="#/shop" className="pr-4 border-r border-gray-400">Shop</a>
        <a href="#">Help</a>
      </div>
      <div className="flex items-center">
        <a href="#/cart" className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-md mr-2"><ShoppingCart className="w-4 h-4 mr-2" />Your Cart</a>
        {user ? (
          <div className="flex items-center gap-2">
            {isSellerOrAdmin ? (
              <a href={isAdmin ? '#/admin' : '#/seller'} className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-md">
                {isAdmin ? <Shield className="w-4 h-4 mr-2" /> : <Store className="w-4 h-4 mr-2" />}
                {isAdmin ? 'Admin' : 'Seller'}
              </a>
            ) : (
              <a href="#/account" className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-md"><User className="w-4 h-4 mr-2" />Account</a>
            )}
            <button onClick={() => { logout(); window.location.hash = '#/' }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm"><LogOut className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="#/login" className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm">Login</a>
            <a href="#/seller/login" className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm">Seller</a>
            <a href="#/admin/login" className="bg-gray-500 text-white px-3 py-2 rounded-md text-sm">Admin</a>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
