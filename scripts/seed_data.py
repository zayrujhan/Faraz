"""
Seed the Vend database with demo users, nested categories, products, and orders.

Usage:
    python scripts/seed_data.py
    python scripts/seed_data.py --products 1000

Skips seeding if demo users already exist (safe for existing databases).
"""

import argparse
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.crud import create_address, create_category, create_product, create_user
from app.database import Local_Session
from app import models, schemas

DEFAULT_PASSWORD = "password123"

CATEGORY_TREE = {
    "Electronics": ["Phones", "Laptops", "Accessories"],
    "Fashion": ["Mens Clothing", "Womens Clothing", "Shoes"],
    "Home": ["Kitchen", "Furniture", "Decor"],
    "Books": ["Fiction", "Non-Fiction", "Textbooks"],
    "Sports": ["Fitness", "Outdoor", "Team Sports"],
    "Beauty": ["Skincare", "Makeup", "Grooming"],
    "Toys": ["Games", "Kids Toys", "Collectibles"],
    "Groceries": ["Snacks", "Pantry", "Beverages"],
    "Automotive": ["Car Care", "Tools", "Accessories Auto"],
    "Health": ["Wellness", "Medical Supplies", "Vitamins"],
}

ADJECTIVES = [
    "Premium", "Essential", "Classic", "Compact", "Deluxe", "Eco", "Smart",
    "Pro", "Lite", "Ultra", "Everyday", "Travel", "Studio", "Urban",
]

NOUNS = [
    "Headphones", "Backpack", "Kettle", "Sneakers", "Novel", "Yoga Mat",
    "Moisturizer", "Puzzle", "Granola", "Car Charger", "Vitamin Pack",
    "Desk Lamp", "Water Bottle", "Hoodie", "Notebook", "Bluetooth Speaker",
    "Coffee Maker", "Running Shorts", "Face Wash", "Board Game",
]

ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]


def seed_users(db):
    users = [
        schemas.UserCreate(name="Admin User", email="admin@example.com", password=DEFAULT_PASSWORD, phone="1000000001", role="admin"),
        schemas.UserCreate(name="Seller One", email="seller1@example.com", password=DEFAULT_PASSWORD, phone="1000000002", role="seller"),
        schemas.UserCreate(name="Seller Two", email="seller2@example.com", password=DEFAULT_PASSWORD, phone="1000000003", role="seller"),
        schemas.UserCreate(name="Seller Three", email="seller3@example.com", password=DEFAULT_PASSWORD, phone="1000000004", role="seller"),
        schemas.UserCreate(name="Customer One", email="customer1@example.com", password=DEFAULT_PASSWORD, phone="1000000005", role="customer"),
        schemas.UserCreate(name="Customer Two", email="customer2@example.com", password=DEFAULT_PASSWORD, phone="1000000006", role="customer"),
    ]
    created = []
    for user in users:
        existing = db.query(models.User).filter(models.User.email == user.email).first()
        created.append(existing or create_user(db, user))
    return created


def seed_category_hierarchy(db):
    top_level = []
    subcategories = []
    for parent_name, children in CATEGORY_TREE.items():
        parent = db.query(models.Category).filter(models.Category.name == parent_name).first()
        if not parent:
            parent = create_category(db, schemas.CategoryCreate(name=parent_name, description=f"{parent_name} department"))
        top_level.append(parent)
        for child_name in children:
            child = db.query(models.Category).filter(models.Category.name == child_name).first()
            if not child:
                child = create_category(
                    db,
                    schemas.CategoryCreate(name=child_name, description=f"{child_name} in {parent_name}", parent_id=parent.id),
                )
            subcategories.append(child)
    return top_level, subcategories


def seed_addresses(db, customers):
    addresses = []
    for index, customer in enumerate(customers, start=1):
        existing = db.query(models.Address).filter(models.Address.user_id == customer.id).first()
        if existing:
            addresses.append(existing)
            continue
        addresses.append(
            create_address(
                db,
                user_id=customer.id,
                address=schemas.AddressCreate(
                    street=f"{100 + index} Market Street",
                    city="Dhaka",
                    state="Dhaka",
                    country="Bangladesh",
                    postal_code=f"120{index}",
                ),
            )
        )
    return addresses


DESCRIPTION_TEMPLATES = [
    "Discover the {name}. Premium quality, fast delivery, and easy returns only at Faraz.",
    "The {name} is a great addition to your collection. Shop now with secure checkout and reliable shipping.",
    "Upgrade your everyday routine with the {name}. Handpicked for Faraz customers at a competitive price.",
    "Get the {name} today. Durable, practical, and backed by friendly Faraz support.",
    "Experience the {name} — a trusted choice for value and quality. Order from Faraz with confidence.",
]


def seed_products(db, subcategories, top_level, sellers, product_count):
    seller_ids = [u.id for u in sellers if u.role == "seller"]
    category_pool = subcategories + top_level
    created = 0
    for index in range(1, product_count + 1):
        category = random.choice(category_pool)
        name = f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)} #{index}"
        description = DESCRIPTION_TEMPLATES[index % len(DESCRIPTION_TEMPLATES)].format(name=name)
        product = schemas.ProductBase(
            name=name,
            description=description,
            price=round(random.uniform(5, 500), 2),
            stock=random.randint(0, 250),
            category_id=category.id,
        )
        create_product(db, product=product, seller_id=random.choice(seller_ids))
        created += 1
    return created


def seed_orders(db, customers, sellers):
    products = db.query(models.Product).filter(models.Product.is_active.is_(True)).all()
    if not products:
        return 0

    seller_ids = [u.id for u in sellers if u.role == "seller"]
    orders_created = 0
    now = datetime.now(timezone.utc)

    for day_offset in range(90, 0, -3):
        customer = random.choice(customers)
        address = db.query(models.Address).filter(models.Address.user_id == customer.id).first()
        if not address:
            continue

        order = models.Order(
            user_id=customer.id,
            address_id=address.id,
            total_amount=0,
            status="pending",
            created_at=now - timedelta(days=day_offset),
        )
        db.add(order)
        db.flush()

        item_count = random.randint(1, 4)
        total = 0
        for _ in range(item_count):
            product = random.choice(products)
            quantity = random.randint(1, 3)
            status_roll = random.random()
            if status_roll < 0.55:
                status = "Delivered"
            elif status_roll < 0.7:
                status = "Cancelled"
            elif status_roll < 0.85:
                status = random.choice(["Pending", "Processing"])
            else:
                status = "Shipped"

            db.add(
                models.OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    price=product.price,
                    status=status,
                )
            )
            total += product.price * quantity

        order.total_amount = round(total, 2)
        orders_created += 1

    db.commit()
    return orders_created


def main():
    parser = argparse.ArgumentParser(description="Seed Vend demo data")
    parser.add_argument("--products", type=int, default=1000, help="Number of products to create")
    args = parser.parse_args()

    db = Local_Session()
    try:
        if db.query(models.User).filter(models.User.email == "admin@example.com").first():
            print("Demo users already exist — skipping seed to preserve existing data.")
            print("Use a fresh database or manually clear demo data to reseed.")
            return

        users = seed_users(db)
        top_level, subcategories = seed_category_hierarchy(db)
        sellers = [u for u in users if u.role == "seller"]
        customers = [u for u in users if u.role == "customer"]
        seed_addresses(db, customers)
        product_count = seed_products(db, subcategories, top_level, sellers, args.products)
        orders_count = seed_orders(db, customers, sellers)

        print("Seed complete")
        print(f"Users: {len(users)}")
        print(f"Top-level categories: {len(top_level)}")
        print(f"Subcategories: {len(subcategories)}")
        print(f"Products: {product_count}")
        print(f"Orders: {orders_count}")
        print(f"Default password for all demo users: {DEFAULT_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
