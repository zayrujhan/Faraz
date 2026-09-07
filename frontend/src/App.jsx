import HomePage from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/Register";
import Shop from "./pages/Productpage";
import ProductDetails from "./pages/ProductDetails";
import ShoppingCart from "./pages/ShoppingCart";
import { useEffect, useState } from 'react'

function App() {
    const [route, setRoute] = useState(window.location.hash.slice(1) || '/')
    useEffect(() => {
      const onHashChange = () => setRoute(window.location.hash.slice(1) || '/')
      window.addEventListener('hashchange', onHashChange)
      return () => window.removeEventListener('hashchange', onHashChange)
    }, [])

    const [pathname, queryString = ''] = route.split('?')
    if (pathname === '/login') return <Login />
    if (pathname === '/register') return <Register />
    if (pathname === '/shop') return <Shop search={new URLSearchParams(queryString).get('search') || ''} />
    if (pathname === '/cart') return <ShoppingCart />
    if (pathname.startsWith('/products/')) return <ProductDetails productId={pathname.split('/')[2]} />
    return <HomePage />
}

export default App;
