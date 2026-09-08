import { useState } from 'react'
import { Search, ShoppingCart, Menu, X, User, Store, Shield, LogOut, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logoImage } from '../lib/images'

export default function Navbar() {
  const { user, logout, isSeller, isAdmin, isSellerOrAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')

  const submitSearch = (e) => {
    e.preventDefault()
    const q = search.trim()
    window.location.hash = q ? `#/shop?search=${encodeURIComponent(q)}` : '#/shop'
    setMobileOpen(false)
  }

  const logoUrl = logoImage(user?.logo_url, 32)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-app">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <a href="#/" className="flex items-center gap-2 shrink-0">
            <img src={logoUrl} alt="Faraz" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Faraz</span>
          </a>

          {/* Search - desktop */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, categories..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </form>

          {/* Right nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a href="#/" className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">Home</a>
            <a href="#/shop" className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">Shop</a>

            {user ? (
              <>
                {isSellerOrAdmin ? (
                  <a href={isAdmin ? '#/admin' : '#/seller'} className="flex items-center gap-1.5 px-3 py-2 text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100">
                    <Store className="w-4 h-4" />
                    {isAdmin ? 'Admin' : 'Seller'}
                  </a>
                ) : (
                  <>
                    <a href="#/orders" className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">
                      <Package className="w-4 h-4" /> Orders
                    </a>
                    <a href="#/cart" className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">
                      <ShoppingCart className="w-4 h-4" /> Cart
                    </a>
                  </>
                )}

                <div className="relative group ml-1">
                  <button className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 hidden group-hover:block">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-44 text-left">
                      <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500">
                        Signed in as <span className="font-medium text-gray-700">{user.email}</span>
                      </div>
                      {!isSellerOrAdmin && (
                        <a href="#/orders" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">My Orders</a>
                      )}
                      {isSellerOrAdmin && (
                        <a href={isAdmin ? '#/admin' : '#/seller/settings'} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                          {isAdmin ? 'Admin Dashboard' : 'Store Settings'}
                        </a>
                      )}
                      <button
                        onClick={() => { logout(); window.location.hash = '#/' }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <a href="#/login" className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">Sign In</a>
                <a href="#/register" className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50">Register</a>
                <a href="#/seller/login" className="flex items-center gap-1.5 px-3 py-2 text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100">
                  <Store className="w-4 h-4" /> Seller
                </a>
                <a href="#/admin/login" className="flex items-center gap-1.5 px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  <Shield className="w-4 h-4" /> Admin
                </a>
              </>
            )}
          </nav>

          {/* Mobile toggles */}
          <div className="flex md:hidden items-center gap-2">
            <a href="#/cart" className="p-2 text-gray-600 hover:bg-gray-50 rounded-md">
              <ShoppingCart className="w-5 h-5" />
            </a>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-md">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container-app py-4 space-y-3">
            <form onSubmit={submitSearch} className="flex">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="px-3 bg-indigo-600 text-white rounded-r-md"><Search className="w-4 h-4" /></button>
            </form>
            <a href="#/" onClick={() => setMobileOpen(false)} className="block text-gray-600 py-2">Home</a>
            <a href="#/shop" onClick={() => setMobileOpen(false)} className="block text-gray-600 py-2">Shop</a>
            {user ? (
              <>
                {isSellerOrAdmin ? (
                  <a href={isAdmin ? '#/admin' : '#/seller'} onClick={() => setMobileOpen(false)} className="block text-indigo-700 py-2">
                    {isAdmin ? 'Admin Dashboard' : 'Seller Dashboard'}
                  </a>
                ) : (
                  <>
                    <a href="#/orders" onClick={() => setMobileOpen(false)} className="block text-gray-600 py-2">My Orders</a>
                    <a href="#/cart" onClick={() => setMobileOpen(false)} className="block text-gray-600 py-2">Cart</a>
                  </>
                )}
                <button
                  onClick={() => { logout(); window.location.hash = '#/'; setMobileOpen(false) }}
                  className="block text-red-600 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="#/login" onClick={() => setMobileOpen(false)} className="block text-gray-600 py-2">Customer Sign In</a>
                <a href="#/register" onClick={() => setMobileOpen(false)} className="block text-gray-600 py-2">Register</a>
                <a href="#/seller/login" onClick={() => setMobileOpen(false)} className="block text-indigo-700 py-2">Seller Sign In</a>
                <a href="#/admin/login" onClick={() => setMobileOpen(false)} className="block text-gray-700 py-2">Admin Sign In</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
