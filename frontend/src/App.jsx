import { HashRouter, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import HomePage from './pages/Home'
import Login from './pages/login'
import SellerLogin from './pages/SellerLogin'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import Shop from './pages/Productpage'
import ProductDetails from './pages/ProductDetails'
import ShoppingCart from './pages/ShoppingCart'
import CustomerOrders from './pages/CustomerOrders'
import SellerLayout from './components/seller/SellerLayout'
import Dashboard from './pages/seller/Dashboard'
import ProductList from './pages/seller/ProductList'
import ProductForm from './pages/seller/ProductForm'
import OrderList from './pages/seller/OrderList'
import OrderDetail from './pages/seller/OrderDetail'
import Analytics from './pages/seller/Analytics'
import Settings from './pages/seller/Settings'
import AdminDashboard from './pages/AdminDashboard'
import ChatWidget from './components/ChatWidget'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function LoginRedirect({ role }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return role === 'customer' ? <Login /> : role === 'seller' ? <SellerLogin /> : <AdminLogin />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'seller') return <Navigate to="/seller" replace />
  return <Navigate to="/" replace />
}

function RegisterRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Register />
}

function ProductDetailsWrapper() {
  const { id } = useParams()
  return <ProductDetails productId={id} />
}

function ShopWrapper() {
  const [searchParams] = useSearchParams()
  return <Shop search={searchParams.get('search') || ''} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect role="customer" />} />
      <Route path="/seller/login" element={<LoginRedirect role="seller" />} />
      <Route path="/admin/login" element={<LoginRedirect role="admin" />} />
      <Route path="/register" element={<RegisterRedirect />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopWrapper />} />
      <Route path="/products/:id" element={<ProductDetailsWrapper />} />
      <Route path="/cart" element={<ShoppingCart />} />
      <Route path="/orders" element={<CustomerOrders />} />

      <Route
        path="/seller"
        element={
          <ProtectedRoute roles={['seller', 'admin']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
        <ChatWidget />
      </AuthProvider>
    </HashRouter>
  )
}
