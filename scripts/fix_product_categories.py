"""
Reassign seeded products to sensible subcategories based on their names.

This is a one-time cleanup for demo data. It does not affect products that
already have a sensible category assignment, only those whose current category
does not match their name.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Local_Session
from app import models

# keyword -> subcategory_id (must match the IDs printed by list_categories.py)
KEYWORD_TO_SUBCATEGORY = {
    # Electronics
    "headphone": 13, "headphones": 13,
    "laptop": 12, "notebo": 12,
    "phone": 11, "charger": 13, "speaker": 13, "bluetooth": 13,
    # Fashion
    "sneaker": 16, "shoe": 16, "shoes": 16,
    "hoodie": 14, "shorts": 14, "t-shirt": 14, "shirt": 14, "jacket": 14,
    "dress": 15, "skirt": 15, "blouse": 15, "heels": 15, "sandals": 16,
    # Home & Kitchen
    "kettle": 17, "coffee maker": 17, "coffeemaker": 17, "lamp": 19,
    "desk": 18, "chair": 18, "table": 18, "mattress": 18, "curtain": 19,
    # Books
    "novel": 20, "fiction": 20, "textbook": 22, "biography": 21, "history": 21,
    # Sports
    "yoga mat": 23, "dumbbell": 23, "fitness": 23, "tent": 24, "backpack": 24,
    "ball": 25, "bat": 25, "jersey": 25,
    # Beauty
    "moisturizer": 26, "face wash": 26, "serum": 26, "makeup": 27,
    "perfume": 28, "razor": 28, "shampoo": 28,
    # Toys
    "puzzle": 30, "board game": 29, "toy": 30, "action figure": 30,
    # Groceries
    "granola": 32, "snack": 32, "coffee": 33, "tea": 33, "pasta": 33, "beverage": 34,
    # Automotive
    "car charger": 37, "car care": 35, "tool": 36, "wiper": 35,
    # Health
    "vitamin": 40, "supplement": 40, "medical": 39, "wellness": 38,
}


def main():
    db = Local_Session()
    try:
        categories = {c.id: c for c in db.query(models.Category).all()}
        products = db.query(models.Product).all()

        reassigned = 0
        already_ok = 0

        for product in products:
            name_lower = product.name.lower()
            chosen_id = None
            for keyword, subcategory_id in KEYWORD_TO_SUBCATEGORY.items():
                if keyword in name_lower:
                    chosen_id = subcategory_id
                    break

            if not chosen_id:
                # Could not map, leave as is.
                continue

            if product.category_id == chosen_id:
                already_ok += 1
                continue

            old_cat = categories.get(product.category_id)
            new_cat = categories.get(chosen_id)
            product.category_id = chosen_id
            reassigned += 1
            print(f"#{product.id}: {product.name} -> {new_cat.name} (was {old_cat.name if old_cat else 'unknown'})")

        db.commit()
        print(f"\nReassigned {reassigned} products. {already_ok} already correct. {len(products) - reassigned - already_ok} unmapped.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
