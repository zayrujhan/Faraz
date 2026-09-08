from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime

# USER SCHEMAS
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Optional[str] = "customer"

class UserCreate(UserBase):
    password: str


class AdminCreate(UserCreate):
    """Schema for creating an admin user. Includes a server-side secret to authorize admin creation."""
    admin_secret: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    store_name: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    store_name: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True

# ADDRESS SCHEMAS
class AddressBase(BaseModel):
    street: str
    city: str
    state: str
    country: str
    postal_code: str
    shipping_method_id: Optional[int] = None

class AddressUpdate(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    shipping_method_id: Optional[int] = None

class Address(AddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class AddressCreate(AddressBase):
    pass

class ShippingMethodBase(BaseModel):
    name: str
    price: float
    delivery_estimate: str

class ShippingMethod(ShippingMethodBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# CATEGORY SCHEMAS
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class CategoryCreate(CategoryBase):
    pass

class CategoryChild(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class CategoryTree(CategoryBase):
    id: int
    children: List[CategoryChild] = []

    class Config:
        from_attributes = True

class CategoryDetail(CategoryTree):
    pass

# PRODUCT SCHEMAS
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category_id: int
    seller_id: Optional[int] = None
    image_url: Optional[str] = None

class Product(ProductBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime] = None
    seller: Optional[User] = None

    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    stock: int = Field(ge=0)

class PriceUpdate(BaseModel):
    price: float = Field(gt=0)

# CART SCHEMAS
class CartItemBase(BaseModel):
    product_id: int
    quantity: int

class CartItem(CartItemBase):
    id: int
    cart_id: int
    product: Product

    class Config:
        from_attributes = True

class Cart(BaseModel):
    id: int
    user_id: int
    items: List[CartItem] = []

    class Config:
        from_attributes = True

# ORDER SCHEMAS
class OrderFromCart(BaseModel):
    cart_id: int
    address_id: int

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    status: str = "Pending"
    product: Product

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    address_id: int
    total_amount: float

class Order(OrderBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    items: List[OrderItem] = []

    class Config:
        from_attributes = True

class PaymentMethod(BaseModel):
    id: int
    name: str
    description: str
    requires_card_details: bool
    is_active: bool

    class Config:
        from_attributes = True

class CheckoutRequest(BaseModel):
    payment_method_id: int

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    method: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CheckoutResponse(BaseModel):
    order: Order
    payment: PaymentResponse

# REVIEW SCHEMAS
class ReviewBase(BaseModel):
    product_id: int
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# WISHLIST SCHEMAS
class WishlistBase(BaseModel):
    product_id: int

class WishlistCreate(WishlistBase):
    pass

class WishlistResponse(WishlistBase):
    id: int
    user_id: int
    product: Product

    class Config:
        from_attributes = True

# AUTH SCHEMAS
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: int
    email: Optional[str] = None
    role: Optional[str] = None

    class Config:
        from_attributes = True

# SHIPMENT SCHEMAS
class ShipmentBase(BaseModel):
    order_id: int
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    status: Optional[str] = None

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    id: int

    class Config:
        from_attributes = True

# SELLER ORDER SCHEMAS
class SellerOrderCustomer(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class SellerOrderItem(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price: float
    status: str

    class Config:
        from_attributes = True

class SellerOrderResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    total_amount: float
    customer: SellerOrderCustomer
    shipping_address: Address
    items: List[SellerOrderItem]

class OrderItemStatusUpdate(BaseModel):
    status: Literal["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

# SELLER DASHBOARD / SALES
class BestSellingProduct(BaseModel):
    product_id: int
    product_name: str
    units_sold: int
    revenue: float

class RecentSellerOrder(BaseModel):
    order_id: int
    created_at: datetime
    customer_name: str
    item_count: int
    revenue: float

class SellerDashboardResponse(BaseModel):
    total_products: int
    active_products: int
    low_stock_products: int
    out_of_stock_products: int
    pending_orders: int
    completed_orders: int
    total_sales: float
    monthly_sales: float
    recent_orders: List[RecentSellerOrder]
    best_selling_products: List[BestSellingProduct]

class DailySalesPoint(BaseModel):
    date: str
    revenue: float
    orders: int

class MonthlySalesPoint(BaseModel):
    month: str
    revenue: float
    orders: int

class TopSellingProductSummary(BaseModel):
    product_id: int
    product_name: str
    units_sold: int
    revenue: float

class SalesSummaryResponse(BaseModel):
    days: int
    revenue: float
    orders: int
    average_order_value: float
    units_sold: int
    top_selling_products: List[TopSellingProductSummary]
    daily_sales: List[DailySalesPoint]
    monthly_sales: List[MonthlySalesPoint]

# CHAT
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class ChatResponse(BaseModel):
    reply: str
    used_authentication: bool = False

# SELLER PROFILE
class SellerProfileUpdate(BaseModel):
    store_name: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None

class SellerProfile(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    store_name: Optional[str] = None
    store_description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
