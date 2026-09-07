from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from typing import Optional

from . import crud, models, schemas
import os
from .database import Local_Session, engine, get_db
from .auth import (
    create_access_token,
    get_current_user,
    get_current_admin,
    get_current_seller,
    get_current_admin_or_seller,
    get_optional_user,
)
from .dependencies.seller_scope import resolve_seller_scope
from .services import product_service, seller_analytics
from .services.chatbot import generate_chat_reply

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Faraz E-Commerce API",
    description="""
Unified REST API for the **Faraz** marketplace — users, catalog, cart, orders, reviews, and shipments.

### Quick start
1. **Register** via `POST /signup` (customer or seller) or seed the database with `python scripts/seed_data.py`.
2. **Login** via `POST /login` and click **Authorize** in Swagger using the bearer token.
3. Browse **products** and **categories**, then test cart → order → review flows.

### Roles
- **customer** — browse, cart, orders, wishlist, reviews
- **seller** — manage own products and shipments
- **admin** — full user and catalog management
""",
    version="0.1.0",
    contact={
        "name": "Faraz API Support",
        "email": "support@example.com",
    },
    license_info={
        "name": "Private",
    },
    openapi_tags=[
        {"name": "Home", "description": "General info endpoint."},
        {"name": "Auth", "description": "Authentication / sign-up / login endpoints."},
        {"name": "Users", "description": "User CRUD and profile endpoints."},
        {"name": "Addresses", "description": "User address management."},
        {"name": "Categories", "description": "Product category management."},
        {"name": "Products", "description": "Product listing and details."},
        {"name": "Seller Products", "description": "Seller-specific product management."},
        {"name": "Seller Orders", "description": "Seller order fulfillment."},
        {"name": "Seller Dashboard", "description": "Seller analytics and dashboard."},
        {"name": "Chat", "description": "AI customer support chatbot."},
        {"name": "Cart", "description": "Shopping cart endpoints."},
        {"name": "Orders", "description": "Order creation and retrieval."},
        {"name": "Wishlist", "description": "Wishlist management endpoints."},
        {"name": "Reviews", "description": "Product reviews."},
        {"name": "Shipments", "description": "Shipment creation and status management."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency: DB session (re-exported from database module)

# HOME
@app.get("/", tags=["Home"], summary="Welcome message")
def home():
    return {"message": "Welcome to the Faraz E-Commerce API", "docs": "/docs"}

# SIGNUP
@app.post("/signup", response_model=schemas.User, status_code=201, tags=["Auth"], summary="Register a new user")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Prevent creation of admin users via this public endpoint.
    if getattr(user, "role", None) == "admin":
        raise HTTPException(status_code=403, detail="Cannot create admin via this endpoint")

    # Only allow 'customer' or 'seller' roles through the public signup.
    if getattr(user, "role", None) and user.role not in ("customer", "seller"):
        raise HTTPException(status_code=400, detail="Invalid role")

    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.post("/admin/signup", response_model=schemas.User, status_code=201, tags=["Auth"], summary="Register a new admin (requires secret)")
def admin_signup(admin: schemas.AdminCreate, db: Session = Depends(get_db)):

    admin_key = os.getenv("ADMIN_CREATION_KEY")
    if not admin_key:
        raise HTTPException(status_code=500, detail="Admin creation key is not configured on the server")
    if admin.admin_secret != admin_key:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

    db_user = crud.get_user_by_email(db, email=admin.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Force role to admin regardless of client-supplied value
    admin.role = "admin"
    return crud.create_user(db=db, user=admin)


# USER ENDPOINTS
@app.get("/users/", response_model=List[schemas.User], tags=["Users"], summary="List users (admin only)")
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized for this action")
    return crud.get_users(db, skip=skip, limit=limit)

@app.get("/users/{user_id}", response_model=schemas.User, tags=["Users"], summary="Get a user by ID (admin only)")
def read_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You are not authorized for this action")
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.put("/users/{user_id}", response_model=schemas.User, tags=["Users"], summary="Admin: Update a user")
def update_user(user_id: int, update: schemas.UserUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Admin-only: update any user's fields by user_id."""
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user(db, user=db_user, update=update)

@app.delete("/users/{user_id}", response_model=schemas.User, tags=["Users"], summary="Admin: delete a user")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    """Admin-only: delete a user by id."""
    db_user = crud.del_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# SELF (logged-in user) endpoints
# @app.put("/users/me", response_model=schemas.User, tags=["Users"], summary="Update current user's profile")
# def update_me(update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
#     db_user = crud.get_user(db, user_id=current_user.id)
#     if not db_user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return crud.update_user(db, user=db_user, update=update)

@app.put("/users/", response_model=schemas.User, tags=["Users"], summary="Update a user")
def update_user(update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # If the user is an authenticated user, use their ID
    if not current_user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to modify this user")

    db_user = crud.get_user(db, user_id=current_user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user(db, user=db_user, update=update)


@app.delete("/users/", response_model=schemas.User, tags=["Users"], summary="Delete current user's account")
def delete_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_user = crud.del_user(db, user_id=current_user.id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# ADMIN USER MANAGEMENT
@app.put("/admin/users/{user_id}/role", response_model=schemas.User, tags=["Users"], summary="Admin: update user role")
def admin_update_user_role(
    user_id: int,
    update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update.role and update.role not in ["customer", "seller", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    return crud.update_user(db, user=db_user, update=update)

# ADDRESS USER
@app.post("/addresses/", response_model=schemas.Address, tags=["Addresses"], summary="Add an address for current user")
def add_address(address: schemas.AddressCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_address(db, user_id=current_user.id, address=address)

@app.post("/addresses/update", response_model=schemas.Address, tags=["Addresses"], summary="Update current user's address")
def update_address(
    update: schemas.AddressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_address = crud.get_address_by_user(db, user_id=current_user.id)
    if not db_address:
        raise HTTPException(status_code=404, detail="Address not found")
    return crud.update_address(db=db, db_address=db_address, update=update)

@app.get("/addresses/", response_model=List[schemas.Address], tags=["Addresses"], summary="List current user's addresses")
def list_addresses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_addresses(db, user_id=current_user.id)

# CURRENT LOGGED-IN USER
@app.get("/me", response_model=schemas.User, tags=["Auth"], summary="Get current user profile")
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# LOGIN
@app.post("/login", response_model=schemas.Token, tags=["Auth"], summary="Obtain access token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=60)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# CATEGORY ENDPOINTS
@app.post("/categories/", response_model=schemas.Category, tags=["Categories"], summary="Create a category")
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db), admin_seller: models.User = Depends(get_current_admin_or_seller)):
    try:
        return crud.create_category(db, category=category)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/categories/", response_model=list[schemas.Category], tags=["Categories"], summary="List categories")
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)

@app.get("/categories/tree", response_model=List[schemas.CategoryTree], tags=["Categories"], summary="Nested category tree")
def get_category_tree(db: Session = Depends(get_db)):
    return crud.get_category_tree(db)

@app.get("/categories/{category_id}", response_model=schemas.CategoryDetail, tags=["Categories"], summary="Get category with children")
def get_category_detail(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_category(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.get("/categories/{category_id}/children", response_model=List[schemas.Category], tags=["Categories"], summary="List subcategories")
def get_category_children(category_id: int, db: Session = Depends(get_db)):
    if not crud.get_category(db, category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return crud.get_category_children(db, category_id)

@app.get("/categories/{category_id}/products", response_model=List[schemas.Product], tags=["Categories"], summary="Products in category")
def get_category_products(
    category_id: int,
    include_subcategories: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if not crud.get_category(db, category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return crud.get_products_for_category(
        db,
        category_id=category_id,
        include_subcategories=include_subcategories,
        skip=skip,
        limit=limit,
    )

@app.put("/categories/{category_id}", response_model=schemas.Category, tags=["Categories"], summary="Update a category")
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db), admin_seller: models.User = Depends(get_current_admin_or_seller)):
    try:
        updated_category = crud.update_category(db, category_id=category_id, update=category)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category

@app.delete("/categories/{category_id}", tags=["Categories"], summary="Admin : Delete a category")
def delete_category(category_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    deleted_category = crud.delete_category(db, category_id=category_id)
    if not deleted_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# PRODUCT ENDPOINTS
@app.get("/products/", response_model=List[schemas.Product], tags=["Products"], summary="List products")
def list_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None,
    order: str = "asc",
    db: Session = Depends(get_db),
):
    return crud.get_products(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        subcategory_id=subcategory_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        order=order,
        active_only=True,
    )

@app.get("/products/{product_id}", response_model=schemas.Product, tags=["Products"], summary="Get product details")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products/", response_model=schemas.Product, status_code=201, tags=["Products"], summary="Create a new product")
def create_product(product: schemas.ProductBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin_or_seller)):
    """
    Only sellers or admins can create products.
    - If the caller is a seller, the product will be assigned to that seller (seller_id forced).
    - If the caller is an admin, they may optionally include a seller_id in the request to assign the product; otherwise seller_id will be None.
    - A valid category_id must be provided.
    """
    if current_user.role == "seller":
        seller_id = current_user.id
    else:
        # admin: allow admin to optionally set seller_id in request body
        seller_id = product.seller_id if getattr(product, "seller_id", None) is not None else None
        
    try:
        return crud.create_product(db, product=product, seller_id=seller_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# SELLER PRODUCT ENDPOINTS
@app.get("/seller/products", response_model=List[schemas.Product], tags=["Seller Products"], summary="Get seller products")
@app.get("/seller/products/", response_model=List[schemas.Product], include_in_schema=False)
def seller_get_products(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    _, seller_id, is_aggregated = scope
    if is_aggregated:
        return crud.get_products(db, skip=0, limit=10000, active_only=not include_inactive)
    return product_service.get_seller_products(db, seller_id, include_inactive=include_inactive)


@app.post("/seller/products", response_model=schemas.Product, status_code=201, tags=["Seller Products"], summary="Create seller product")
@app.post("/seller/products/", response_model=schemas.Product, status_code=201, include_in_schema=False)
def seller_create_product(
    product: schemas.ProductBase,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    current_user, seller_id, is_aggregated = scope
    if is_aggregated:
        raise HTTPException(status_code=400, detail="Admin must specify seller_id query param to create a product")
    effective_seller_id = seller_id if current_user.role == "seller" else product.seller_id
    if effective_seller_id is None:
        raise HTTPException(status_code=400, detail="seller_id is required")
    try:
        return product_service.create_product_record(db, product, seller_id=effective_seller_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/seller/products/{product_id}", response_model=schemas.Product, tags=["Seller Products"], summary="Seller: update a product")
def seller_update_product(
    product_id: int,
    product_update: schemas.ProductBase,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    current_user, seller_id, is_aggregated = scope
    check_seller_id = None if is_aggregated or current_user.role == "admin" else seller_id
    try:
        updated_product = product_service.update_product_record(
            db,
            product_id=product_id,
            update=product_update,
            seller_id=check_seller_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not updated_product:
        raise HTTPException(status_code=404, detail="Product not found or not authorized")
    return updated_product


@app.delete("/seller/products/{product_id}", tags=["Seller Products"], summary="Seller: soft delete a product")
def seller_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    current_user, seller_id, is_aggregated = scope
    check_seller_id = None if is_aggregated or current_user.role == "admin" else seller_id
    deleted_product = product_service.delete_or_soft_delete_product(
        db,
        product_id=product_id,
        user_id=check_seller_id or current_user.id,
        user_role=current_user.role,
    )
    if not deleted_product:
        raise HTTPException(status_code=404, detail="Product not found or not authorized")
    return {"message": "Product deactivated or deleted successfully", "is_active": deleted_product.is_active}


@app.patch("/seller/products/{product_id}/stock", response_model=schemas.Product, tags=["Seller Products"], summary="Update product stock")
def seller_patch_stock(
    product_id: int,
    update: schemas.StockUpdate,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    current_user, seller_id, is_aggregated = scope
    check_seller_id = None if is_aggregated or current_user.role == "admin" else seller_id
    try:
        product = product_service.update_product_stock(db, product_id, update.stock, check_seller_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not authorized")
    return product


@app.patch("/seller/products/{product_id}/price", response_model=schemas.Product, tags=["Seller Products"], summary="Update product price")
def seller_patch_price(
    product_id: int,
    update: schemas.PriceUpdate,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    current_user, seller_id, is_aggregated = scope
    check_seller_id = None if is_aggregated or current_user.role == "admin" else seller_id
    try:
        product = product_service.update_product_price(db, product_id, update.price, check_seller_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or not authorized")
    return product

# ADMIN PRODUCT MANAGEMENT
@app.delete("/admin/products/{product_id}", tags=["Products"], summary="Admin: delete any product")
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    deleted_product = crud.delete_product(db, product_id=product_id, user_id=admin.id, user_role=admin.role)
    if not deleted_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# CART ENDPOINTS
@app.get("/cart/", response_model=schemas.Cart, tags=["Cart"], summary="Get current user's cart")
def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = crud.get_cart(db, user_id=current_user.id)
    if not cart:
        cart = crud.create_cart(db, user_id=current_user.id)
    return cart

@app.post("/cart/items", response_model=schemas.CartItem, tags=["Cart"], summary="Add item to current user's cart")
def add_item_to_cart(item: schemas.CartItemBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart = crud.get_cart(db, user_id=current_user.id)
    if not cart:
        cart = crud.create_cart(db, user_id=current_user.id)
    try:
        return crud.add_cart_item(db, cart_id=cart.id, item=item)
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            raise HTTPException(status_code=404, detail=str(e))
        if "insufficient" in msg:
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/cart/items/{cart_item_id}", response_model=schemas.CartItem, tags=["Cart"], summary="Update quantity of a cart item")
def update_cart_item(cart_item_id: int, quantity: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    cart = db.query(models.Cart).filter(models.Cart.id == item.cart_id).first()
    if not cart or (cart.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Not allowed to modify this item")
    try:
        item = crud.update_cart_item(db, cart_item_id=cart_item_id, quantity=quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return item

@app.delete("/cart/items/{cart_item_id}", tags=["Cart"], summary="Remove an item from the cart")
def delete_cart_item(cart_item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # item = crud.remove_cart_item(db, cart_item_id)
    # if not item:
    #     raise HTTPException(status_code=404, detail="Cart item not found")
    # cart = db.query(models.Cart).filter(models.Cart.id == item.cart_id).first()
    # if item.cart.user_id != current_user.id and current_user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Not allowed to delete this item")
    # crud.remove_cart_item(db, cart_item_id=cart_item_id)
    # return {"message": "Cart Item Deleted Successfully"}

    item = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    cart = db.query(models.Cart).filter(models.Cart.id == item.cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    if cart.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to delete this item")

    # Step 4: Delete the item safely
    deleted = crud.remove_cart_item(db, cart_item_id=cart_item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cart item not found")

    return {"message": "Cart Item Deleted Successfully"}


# ORDER ENDPOINTS
@app.post("/orders/", response_model=schemas.Order, tags=["Orders"], summary="Create an order from the current user's cart")
def create_order_from_cart(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        return crud.create_order_from_cart_for_user(db=db, user_id=current_user.id)
    except ValueError as e:
        msg = str(e).lower()
        # Map resource-not-found errors to 404, empty cart to 400
        if "not found" in msg:
            raise HTTPException(status_code=404, detail=str(e))
        if "empty" in msg:
            raise HTTPException(status_code=400, detail=str(e))
        # fallback
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/orders/", response_model=List[schemas.Order], tags=["Orders"], summary="List orders for current user")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_orders(db, user_id=current_user.id)

@app.get("/orders/detail/{order_id}", response_model=schemas.Order, tags=["Orders"], summary="Get order detail")
def get_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = crud.get_order(db, order_id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed to access this order")
    return order

# WISHLIST
@app.post("/wishlist/", response_model=schemas.WishlistResponse, status_code=201, tags=["Wishlist"], summary="Add a product to wishlist")
def add_to_wishlist_endpoint(w: schemas.WishlistCreate,
                             db: Session = Depends(get_db),
                             current_user: models.User = Depends(get_current_user)):
    item = crud.add_to_wishlist(db, user_id=current_user.id, product_id=w.product_id)
    return item

@app.get("/wishlist/", response_model=List[schemas.WishlistResponse], tags=["Wishlist"], summary="Get current user's wishlist")
def get_wishlist_endpoint(db: Session = Depends(get_db),current_user: models.User = Depends(get_current_user)):
    return crud.get_wishlist(db, user_id=current_user.id)

@app.delete("/wishlist/{wishlist_id}", status_code=204, tags=["Wishlist"], summary="Remove item from wishlist")
def remove_wishlist_endpoint(wishlist_id: int,db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = crud.remove_from_wishlist(db, wishlist_id)
    if not item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    
    if item.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    return None

# REVIEWS
@app.post("/reviews/", response_model=schemas.ReviewResponse, status_code=201, tags=["Reviews"], summary="Add a review for a product")
def add_review_endpoint(review: schemas.ReviewCreate, db: Session = Depends(get_db),current_user: models.User = Depends(get_current_user)):
    try:
        db_review = crud.create_review(db, user_id=current_user.id, review=review)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return db_review

@app.get("/reviews/{product_id}", response_model=List[schemas.ReviewResponse], tags=["Reviews"], summary="Get reviews for a product")
def get_reviews_endpoint(product_id: int, db: Session = Depends(get_db)):
    return crud.get_reviews_for_product(db, product_id=product_id)

# SHIPMENTS
@app.post("/shipments/", response_model=schemas.ShipmentResponse, status_code=201, tags=["Shipments"], summary="Create a shipment")
def create_shipment_endpoint(shipment: schemas.ShipmentCreate,db: Session = Depends(get_db),admin_seller: models.User = Depends(get_current_admin_or_seller)):
    try:
        db_ship = crud.create_shipment(db, shipment)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return db_ship

@app.get("/shipments/", response_model=List[schemas.ShipmentResponse], tags=["Shipments"], summary="List shipments")
def get_shipments_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin_seller: models.User = Depends(get_current_admin_or_seller)):
    return crud.get_shipments(db, skip=skip, limit=limit)

@app.get("/shipments/{shipment_id}", response_model=schemas.ShipmentResponse, tags=["Shipments"], summary="Get a shipment by ID")
def get_shipment_endpoint(shipment_id: int, db: Session = Depends(get_db), admin_seller: models.User = Depends(get_current_admin_or_seller)):
    ship = crud.get_shipment(db, shipment_id)
    if not ship:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return ship

@app.put("/shipments/{shipment_id}", response_model=schemas.ShipmentResponse, tags=["Shipments"], summary="Update shipment status")
def update_shipment_endpoint(shipment_id: int, status: str,db: Session = Depends(get_db), admin_seller: models.User = Depends(get_current_admin_or_seller)):
    ship = crud.update_shipment_status(db, shipment_id=shipment_id, status=status)
    if not ship:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return ship


# SELLER ORDERS
@app.get("/seller/orders", response_model=List[schemas.SellerOrderResponse], tags=["Seller Orders"], summary="Seller incoming orders")
def seller_orders(
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    _, seller_id, is_aggregated = scope
    return crud.get_seller_orders(db, None if is_aggregated else seller_id)


@app.patch(
    "/seller/orders/{order_id}/items/{item_id}",
    response_model=schemas.SellerOrderItem,
    tags=["Seller Orders"],
    summary="Update seller order item status",
)
def seller_update_order_item(
    order_id: int,
    item_id: int,
    update: schemas.OrderItemStatusUpdate,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    _, seller_id, is_aggregated = scope
    try:
        item = crud.update_seller_order_item_status(
            db,
            order_id=order_id,
            item_id=item_id,
            status=update.status,
            seller_id=None if is_aggregated else seller_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found or not authorized")
    return schemas.SellerOrderItem(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        quantity=item.quantity,
        price=item.price,
        status=item.status,
    )


# SELLER DASHBOARD & SALES
@app.get("/seller/dashboard", response_model=schemas.SellerDashboardResponse, tags=["Seller Dashboard"], summary="Seller dashboard metrics")
def seller_dashboard(
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    _, seller_id, is_aggregated = scope
    return seller_analytics.get_seller_dashboard(db, None if is_aggregated else seller_id)


@app.get("/seller/sales-summary", response_model=schemas.SalesSummaryResponse, tags=["Seller Dashboard"], summary="Seller sales summary")
def seller_sales_summary(
    days: int = 30,
    db: Session = Depends(get_db),
    scope=Depends(resolve_seller_scope),
):
    if days not in (7, 30, 90):
        raise HTTPException(status_code=400, detail="days must be 7, 30, or 90")
    _, seller_id, is_aggregated = scope
    return seller_analytics.get_sales_summary(db, None if is_aggregated else seller_id, days)


# CHAT
@app.post("/chat", response_model=schemas.ChatResponse, tags=["Chat"], summary="Customer support chatbot")
async def chat_endpoint(
    body: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    reply = await generate_chat_reply(db, body.message, current_user.id if current_user else None)
    return schemas.ChatResponse(reply=reply, used_authentication=current_user is not None)
