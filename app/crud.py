from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, asc, desc
from passlib.context import CryptContext
from typing import List, Optional

from . import models, schemas
from .constants import COMPLETED_ORDER_ITEM_STATUSES, ORDER_ITEM_STATUSES
from .services import product_service
from datetime import datetime
# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# USER CRUD
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
        role=user.role or "customer",
        store_name=getattr(user, "store_name", None),
        store_description=getattr(user, "store_description", None),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user(db: Session, user: models.User, update: schemas.UserUpdate) -> models.User:
    if update.name:
        user.name = update.name
    if update.phone:
        user.phone = update.phone
    if update.password:
        user.password = hash_password(update.password)
    if update.role:
        user.role = update.role
    if update.store_name is not None:
        user.store_name = update.store_name
    if update.store_description is not None:
        user.store_description = update.store_description
    if update.logo_url is not None:
        user.logo_url = update.logo_url
    db.commit()
    db.refresh(user)
    return user

def del_user(db: Session, user_id: int) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user

# PRODUCT CRUD
def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category_id: int = None,
    subcategory_id: int = None,
    search: str = None,
    min_price: float = None,
    max_price: float = None,
    sort: str = None,
    order: str = "asc",
    active_only: bool = True,
) -> List[models.Product]:
    return get_products_filtered(
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
        active_only=active_only,
    )


def get_products_filtered(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category_id: int = None,
    subcategory_id: int = None,
    search: str = None,
    min_price: float = None,
    max_price: float = None,
    sort: str = None,
    order: str = "asc",
    active_only: bool = True,
    category_ids: List[int] = None,
) -> List[models.Product]:
    query = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.seller),
    )
    if active_only:
        query = query.filter(models.Product.is_active.is_(True))
    if category_ids is not None:
        query = query.filter(models.Product.category_id.in_(category_ids))
    elif subcategory_id is not None:
        query = query.filter(models.Product.category_id == subcategory_id)
    elif category_id is not None:
        child_ids = [
            c.id for c in db.query(models.Category).filter(models.Category.parent_id == category_id).all()
        ]
        allowed = [category_id] + child_ids
        query = query.filter(models.Product.category_id.in_(allowed))
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(models.Product.name.ilike(pattern), models.Product.description.ilike(pattern))
        )
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    sort_map = {
        "price": models.Product.price,
        "name": models.Product.name,
        "newest": models.Product.created_at,
    }
    if sort in sort_map:
        column = sort_map[sort]
        query = query.order_by(desc(column) if order == "desc" else asc(column))
    else:
        query = query.order_by(models.Product.id.asc())

    return query.offset(skip).limit(limit).all()
def get_product(db: Session, product_id: int, include_inactive: bool = False) -> Optional[models.Product]:
    query = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.seller),
    ).filter(models.Product.id == product_id)
    if not include_inactive:
        query = query.filter(models.Product.is_active.is_(True))
    return query.first()

def create_product(db: Session, product: schemas.ProductBase, seller_id: int = None) -> models.Product:
    return product_service.create_product_record(db, product, seller_id=seller_id)
def get_products_by_seller(db: Session, seller_id: int, include_inactive: bool = False) -> List[models.Product]:
    return product_service.get_seller_products(db, seller_id, include_inactive=include_inactive)

def update_product(db: Session, product_id: int, update: schemas.ProductBase, seller_id: int = None) -> Optional[models.Product]:
    return product_service.update_product_record(db, product_id, update, seller_id=seller_id)

def delete_product(db: Session, product_id: int, user_id: int = None, user_role: str = None) -> Optional[models.Product]:
    return product_service.delete_or_soft_delete_product(db, product_id, user_id, user_role)

def soft_delete_product(db: Session, product_id: int, user_id: int, user_role: str) -> Optional[models.Product]:
    return product_service.soft_delete_product(db, product_id, user_id, user_role)
# CART CRUD
def get_cart(db: Session, user_id: int) -> Optional[models.Cart]:
    return db.query(models.Cart).filter(models.Cart.user_id == user_id).first()

def create_cart(db: Session, user_id: int) -> models.Cart:
    cart = models.Cart(user_id=user_id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart

def add_cart_item(db: Session, cart_id: int, item: schemas.CartItemBase) -> models.CartItem:
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise ValueError("Product not found")
    if not product.is_active:
        raise ValueError("Product is not available")

    if product.stock is not None and item.quantity > product.stock:
        raise ValueError("Insufficient stock")

    existing = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart_id,
        models.CartItem.product_id == item.product_id,
    ).first()
    if existing:
        new_quantity = existing.quantity + item.quantity
        if product.stock is not None and new_quantity > product.stock:
            raise ValueError("Insufficient stock")
        existing.quantity = new_quantity
        db.commit()
        db.refresh(existing)
        return existing

    db_item = models.CartItem(cart_id=cart_id, **item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_cart_item(db: Session, cart_item_id: int, quantity: int) -> models.CartItem:
    item = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id).first()
    if not item:
        return None

    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise ValueError("Product not found")
    if product.stock is not None and quantity > product.stock:
        raise ValueError("Insufficient stock")

    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return item

def remove_cart_item(db: Session, cart_item_id: int) -> Optional[models.CartItem]:
    item = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id).first()
    # if item:
    #     db.delete(item)
    #     db.commit()
    # return item
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


# ORDER CRUD
def create_order(db: Session, order: schemas.OrderBase, user_id: int, items: List[schemas.OrderItemBase]) -> models.Order:
    db_order = models.Order(user_id=user_id, address_id=order.address_id, total_amount=order.total_amount)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    for i in items:
        db_item = models.OrderItem(order_id=db_order.id, **i.dict())
        db.add(db_item)
    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders(db: Session, user_id: int) -> List[models.Order]:
    return db.query(models.Order).filter(models.Order.user_id == user_id).all()

def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def create_order_from_cart_for_user(db: Session, user_id: int) -> models.Order:
    cart = db.query(models.Cart).filter(models.Cart.user_id == user_id).first()
    if not cart:
        raise ValueError("Cart not found for this user")

    address = db.query(models.Address).filter(models.Address.user_id == user_id).first()
    if not address:
        raise ValueError("Address not found for this user")

    cart_items = db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).all()
    if not cart_items:
        raise ValueError("Cart is empty")

    for item in cart_items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise ValueError(f"Product {item.product_id} not found")
        if product.stock is not None and item.quantity > product.stock:
            raise ValueError(f"Insufficient stock for product {product.name}")

    order = models.Order(user_id=user_id, address_id=address.id, total_amount=0)
    db.add(order)
    db.commit()
    db.refresh(order)

    total = 0
    for item in cart_items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=product.price,
            status="Pending",
        )
        db.add(order_item)
        total += item.quantity * product.price
        if product.stock is not None:
            product.stock -= item.quantity

    order.total_amount = total
    db.commit()
    db.refresh(order)

    # Clear the cart items now that the order has been placed
    for item in cart_items:
        # If cart items have relationships, remove them safely
        try:
            db.delete(item)
        except Exception:
            # fallback: ignore deletion error and continue
            pass
    db.commit()

    return order

# CATEGORY CRUD
def _validate_category_parent(db: Session, parent_id: Optional[int]) -> None:
    if parent_id is None:
        return
    parent = db.query(models.Category).filter(models.Category.id == parent_id).first()
    if not parent:
        raise ValueError(f"Parent category with id {parent_id} not found")
    if parent.parent_id is not None:
        raise ValueError("Categories support at most two levels")


def create_category(db: Session, category: schemas.CategoryCreate):
    _validate_category_parent(db, category.parent_id)
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session):
    return db.query(models.Category).all()

def get_category(db: Session, category_id: int) -> Optional[models.Category]:
    return (
        db.query(models.Category)
        .options(joinedload(models.Category.children))
        .filter(models.Category.id == category_id)
        .first()
    )

def get_category_tree(db: Session) -> List[models.Category]:
    return (
        db.query(models.Category)
        .options(joinedload(models.Category.children))
        .filter(models.Category.parent_id.is_(None))
        .all()
    )

def get_category_children(db: Session, category_id: int) -> List[models.Category]:
    return db.query(models.Category).filter(models.Category.parent_id == category_id).all()

def get_category_product_ids(db: Session, category_id: int, include_subcategories: bool = False) -> List[int]:
    ids = [category_id]
    if include_subcategories:
        child_ids = [c.id for c in get_category_children(db, category_id)]
        ids.extend(child_ids)
    return ids

def get_products_for_category(
    db: Session,
    category_id: int,
    include_subcategories: bool = False,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
) -> List[models.Product]:
    category_ids = get_category_product_ids(db, category_id, include_subcategories)
    return get_products_filtered(
        db,
        skip=skip,
        limit=limit,
        category_ids=category_ids,
        active_only=active_only,
    )

def update_category(db: Session, category_id: int, update: schemas.CategoryCreate):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        return None
    if update.parent_id is not None:
        _validate_category_parent(db, update.parent_id)
        if update.parent_id == category_id:
            raise ValueError("Category cannot be its own parent")

    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return category
def delete_category(db: Session, category_id: int):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        return None
    
    db.delete(category)
    db.commit()
    return category

# ADDRESS CRUD
def create_address(db: Session, user_id: int, address: schemas.AddressCreate):
    db_address = models.Address(user_id=user_id, **address.dict())
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def get_addresses(db: Session, user_id: int):
    return db.query(models.Address).filter(models.Address.user_id == user_id).all()

def get_address(db: Session, address_id: int):
    return db.query(models.Address).filter(models.Address.id == address_id).first()

def get_address_by_user(db: Session, user_id: int):
    return db.query(models.Address).filter(models.Address.user_id == user_id).first()

def update_address(db: Session, db_address: models.Address, update: schemas.AddressUpdate):
    for key, value in update.dict(exclude_unset=True).items():
        setattr(db_address, key, value)
    db.commit()
    db.refresh(db_address)
    return db_address

# WISHLIST
def add_to_wishlist(db: Session, user_id: int, product_id: int) -> models.Wishlist:
    exists = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == user_id,
        models.Wishlist.product_id == product_id
    ).first()
    if exists:
        return exists
    item = models.Wishlist(user_id=user_id, product_id=product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def get_wishlist(db: Session, user_id: int):
    return db.query(models.Wishlist).filter(models.Wishlist.user_id == user_id).all()

def remove_from_wishlist(db: Session, wishlist_id: int):
    item = db.query(models.Wishlist).filter(models.Wishlist.id == wishlist_id).first()
    if not item:
        return None
    db.delete(item)
    db.commit()
    return item

# REVIEWS 
def create_review(db: Session, user_id: int, review: schemas.ReviewCreate) -> models.Review:
    if review.rating < 1 or review.rating > 5:
        raise ValueError("rating must be between 1 and 5")
    db_review = models.Review(
        user_id=user_id,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_for_product(db: Session, product_id: int):
    return db.query(models.Review).filter(models.Review.product_id == product_id).all()

# SHIPMENTS 
def create_shipment(db: Session, shipment_in: schemas.ShipmentCreate) -> models.Shipment:
    order = db.query(models.Order).filter(models.Order.id == shipment_in.order_id).first()
    if not order:
        raise ValueError("Order not found")
    db_shipment = models.Shipment(
        order_id=shipment_in.order_id,
        tracking_number=shipment_in.tracking_number,
        carrier=shipment_in.carrier,
        status=shipment_in.status or "preparing"
    )
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

def get_shipment(db: Session, shipment_id: int):
    return db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()

def update_shipment_status(db: Session, shipment_id: int, status: str):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        return None
    shipment.status = status
    db.commit()
    db.refresh(shipment)
    return shipment

def get_shipments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Shipment).offset(skip).limit(limit).all()


# SELLER ORDERS
def get_seller_orders(db: Session, seller_id: Optional[int]) -> List[schemas.SellerOrderResponse]:
    query = (
        db.query(models.OrderItem)
        .join(models.Product, models.OrderItem.product_id == models.Product.id)
        .join(models.Order, models.OrderItem.order_id == models.Order.id)
        .options(
            joinedload(models.OrderItem.order).joinedload(models.Order.user),
            joinedload(models.OrderItem.order).joinedload(models.Order.items),
            joinedload(models.OrderItem.product),
        )
    )
    if seller_id is not None:
        query = query.filter(models.Product.seller_id == seller_id)

    order_items = query.all()
    grouped = {}
    for item in order_items:
        if seller_id is not None and item.product.seller_id != seller_id:
            continue
        grouped.setdefault(item.order_id, []).append(item)

    responses = []
    for order_id, items in grouped.items():
        order = items[0].order
        address = db.query(models.Address).filter(models.Address.id == order.address_id).first()
        if not address:
            continue
        responses.append(
            schemas.SellerOrderResponse(
                id=order.id,
                status=order.status,
                created_at=order.created_at,
                total_amount=order.total_amount,
                customer=schemas.SellerOrderCustomer.model_validate(order.user),
                shipping_address=schemas.Address.model_validate(address),
                items=[
                    schemas.SellerOrderItem(
                        id=i.id,
                        product_id=i.product_id,
                        product_name=i.product.name,
                        quantity=i.quantity,
                        price=i.price,
                        status=i.status,
                    )
                    for i in items
                ],
            )
        )
    responses.sort(key=lambda x: x.created_at, reverse=True)
    return responses


def update_seller_order_item_status(
    db: Session,
    order_id: int,
    item_id: int,
    status: str,
    seller_id: Optional[int],
) -> Optional[models.OrderItem]:
    if status not in ORDER_ITEM_STATUSES:
        raise ValueError(f"Invalid status. Allowed: {', '.join(ORDER_ITEM_STATUSES)}")

    item = (
        db.query(models.OrderItem)
        .options(joinedload(models.OrderItem.product))
        .filter(models.OrderItem.id == item_id, models.OrderItem.order_id == order_id)
        .first()
    )
    if not item:
        return None
    if seller_id is not None and item.product.seller_id != seller_id:
        return None

    item.status = status
    db.commit()
    db.refresh(item)
    return item