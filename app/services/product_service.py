from typing import List, Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.constants import COMPLETED_ORDER_ITEM_STATUSES


def validate_category(db: Session, category_id: int) -> models.Category:
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise ValueError(f"Category with id {category_id} not found")
    if category.parent_id is not None:
        parent = db.query(models.Category).filter(models.Category.id == category.parent_id).first()
        if parent and parent.parent_id is not None:
            raise ValueError("Categories support at most two levels")
    return category


def validate_product_values(price: float, stock: int) -> None:
    if price <= 0:
        raise ValueError("price must be greater than 0")
    if stock < 0:
        raise ValueError("stock must be greater than or equal to 0")


def product_has_completed_order_items(db: Session, product_id: int) -> bool:
    return (
        db.query(models.OrderItem)
        .filter(
            models.OrderItem.product_id == product_id,
            models.OrderItem.status.in_(COMPLETED_ORDER_ITEM_STATUSES),
        )
        .first()
        is not None
    )


def create_product_record(
    db: Session,
    product: schemas.ProductBase,
    seller_id: Optional[int] = None,
) -> models.Product:
    validate_product_values(product.price, product.stock)
    validate_category(db, product.category_id)

    product_data = product.model_dump(exclude={"seller_id"})
    if seller_id is not None:
        product_data["seller_id"] = seller_id

    db_product = models.Product(**product_data, is_active=True)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product_record(
    db: Session,
    product_id: int,
    update: schemas.ProductBase,
    seller_id: Optional[int] = None,
) -> Optional[models.Product]:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    if seller_id is not None and product.seller_id != seller_id:
        return None

    validate_product_values(update.price, update.stock)
    validate_category(db, update.category_id)

    for key, value in update.model_dump(exclude={"seller_id"}, exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def soft_delete_product(
    db: Session,
    product_id: int,
    user_id: int,
    user_role: str,
) -> Optional[models.Product]:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    if user_role == "seller" and product.seller_id != user_id:
        return None
    if user_role not in ("seller", "admin"):
        return None

    product.is_active = False
    db.commit()
    db.refresh(product)
    return product


def delete_or_soft_delete_product(
    db: Session,
    product_id: int,
    user_id: int,
    user_role: str,
) -> Optional[models.Product]:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    if user_role == "seller" and product.seller_id != user_id:
        return None
    if user_role not in ("seller", "admin"):
        return None

    if product_has_completed_order_items(db, product_id):
        product.is_active = False
        db.commit()
        db.refresh(product)
        return product

    db.delete(product)
    db.commit()
    return product


def update_product_stock(db: Session, product_id: int, stock: int, seller_id: Optional[int]) -> Optional[models.Product]:
    if stock < 0:
        raise ValueError("stock must be greater than or equal to 0")
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    if seller_id is not None and product.seller_id != seller_id:
        return None
    product.stock = stock
    db.commit()
    db.refresh(product)
    return product


def update_product_price(db: Session, product_id: int, price: float, seller_id: Optional[int]) -> Optional[models.Product]:
    if price <= 0:
        raise ValueError("price must be greater than 0")
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    if seller_id is not None and product.seller_id != seller_id:
        return None
    product.price = price
    db.commit()
    db.refresh(product)
    return product


def get_seller_products(
    db: Session,
    seller_id: Optional[int],
    include_inactive: bool = False,
) -> List[models.Product]:
    query = db.query(models.Product)
    if seller_id is not None:
        query = query.filter(models.Product.seller_id == seller_id)
    if not include_inactive:
        query = query.filter(models.Product.is_active.is_(True))
    return query.all()
