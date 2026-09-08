const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const PLACEHOLDER_SERVICE = 'https://picsum.photos/seed'

export function productImage(product, width = 400, height = 400) {
  if (!product) return ''
  if (product.image_url) {
    return product.image_url.startsWith('http')
      ? product.image_url
      : `${API_URL}${product.image_url}`
  }
  return `${PLACEHOLDER_SERVICE}/${product.id}/${width}/${height}`
}

export function logoImage(logoUrl, width = 32) {
  if (!logoUrl) return `${API_URL}/uploads/farazlogo.png`
  return logoUrl.startsWith('http') ? logoUrl : `${API_URL}${logoUrl}`
}

export function avatarImage(seed = 'user', width = 120) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&size=${width}`
}
