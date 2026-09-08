import { HashRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import HomePage from './pages/Home'
import Login from './pages/login'
import SellerLogin from './pages/SellerLogin'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import Shop from './pages/Productpage'
import ProductDetails from './pages/ProductDetails'
import ShoppingCart from './pages/ShoppingCart'
import ShippingDetails from './pages/shippingDetails'
import PaymentDetails from './pages/PaymentDetails'
import Account from './pages/Account'
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

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function LoginPage({ role }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'seller') return <Navigate to="/seller" replace />
    return <Navigate to="/" replace />
  }
  if (role === 'seller') return <SellerLogin />
  if (role === 'admin') return <AdminLogin />
  return <Login />
}

function RegisterRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : <Register />
}

function ProductDetailsWrapper() {
  const { id } = useParams()
  return <ProductDetails productId={id} />
}

function ShopWrapper() {
  const [params] = useSearchParams()
  return <Shop search={params.get('search') || ''} />
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage role="customer" />} />
    <Route path="/seller/login" element={<LoginPage role="seller" />} />
    <Route path="/admin/login" element={<LoginPage role="admin" />} />
    <Route path="/register" element={<RegisterRedirect />} />
    <Route path="/shop" element={<ShopWrapper />} />
    <Route path="/products/:id" element={<ProductDetailsWrapper />} />
    <Route path="/cart" element={<ShoppingCart />} />
    <Route path="/shipping" element={<ShippingDetails />} />
    <Route path="/payment" element={<PaymentDetails />} />
    <Route path="/account" element={<ProtectedRoute roles={['customer']}><Account /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute roles={['customer']}><CustomerOrders /></ProtectedRoute>} />

    <Route path="/seller" element={<ProtectedRoute roles={['seller']}><SellerLayout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="products" element={<ProductList />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id" element={<ProductForm />} />
      <Route path="orders" element={<OrderList />} />
      <Route path="orders/:id" element={<OrderDetail />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="settings" element={<Settings />} />
    </Route>

    <Route path="/admin" element={<ProtectedRoute roles={['admin']}><SellerLayout /></ProtectedRoute>}>
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

export default function App() {
  return <HashRouter><AuthProvider><AppRoutes /></AuthProvider></HashRouter>
}
