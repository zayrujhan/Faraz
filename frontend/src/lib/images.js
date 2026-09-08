const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function productImage(product, width = 400, height = 400) {
  if (!product) return ''
  if (product.image_url) {
    return product.image_url.startsWith('http') ? product.image_url : `${API_URL}${product.image_url}`
  }
  return `https://picsum.photos/seed/${product.id}/${width}/${height}`
}

export function logoUrl() {
  return `${API_URL}/uploads/farazlogo.png`
}

export function sellerLogo(user) {
  if (user?.logo_url) {
    return user.logo_url.startsWith('http') ? user.logo_url : `${API_URL}${user.logo_url}`
  }
  return logoUrl()
}

export function sellerAvatar(user) {
  if (user?.logo_url) {
    return user.logo_url.startsWith('http') ? user.logo_url : `${API_URL}${user.logo_url}`
  }
  const name = user?.name || user?.store_name || 'Seller'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=374151&color=fff&size=128`
}
