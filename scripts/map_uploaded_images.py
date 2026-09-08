"""
Map image files in the uploads folder to products or sellers based on filename.

Naming convention for products:
    compactkettle.jpg         -> matches "Compact Kettle #1"
    travelbackpack.jpg         -> matches "Travel Backpack #2"
    deluxedesklamp.jpg         -> matches "Deluxe Desk Lamp #7"
    ecopuzzle.jpg              -> matches "Eco Puzzle #6"

Naming convention for seller profile pictures:
    profilepictureselleraminumberone.jpg -> first seller (number one)

Other images that do not match are left unchanged and reported.
"""
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Local_Session
from app import models

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def clean(text: str) -> str:
    """Lowercase and strip non-alphanumeric characters."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def is_profile_picture(filename: str) -> bool:
    return "profilepicture" in clean(filename) or ("profile" in filename.lower() and "seller" in filename.lower())


def is_site_logo(filename: str) -> bool:
    return "logo" in filename.lower() and "profile" not in filename.lower() and "seller" not in filename.lower()


def seller_number_from_filename(filename: str) -> int:
    """Guess seller ordinal from filename: numberone/one/1 -> 1, numbertwo/two/2 -> 2, etc."""
    c = clean(filename)
    for num, words in enumerate(
        [
            ("one", "1", "numberone"),
            ("two", "2", "numbertwo"),
            ("three", "3", "numberthree"),
        ],
        start=1,
    ):
        if any(w in c for w in words):
            return num
    return 1


def main():
    db = Local_Session()
    try:
        products = db.query(models.Product).all()
        sellers = (
            db.query(models.User)
            .filter(models.User.role == "seller")
            .order_by(models.User.id)
            .all()
        )

        image_files = [
            f for f in UPLOAD_DIR.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
        ]

        mapped_products = 0
        mapped_sellers = 0
        skipped = []
        assigned_product_ids = set()

        for file in sorted(image_files, key=lambda f: f.name):
            filename = file.name
            # Strip extension before matching so "compactkettle.jpg" matches "Compact Kettle #1"
            name_without_ext = filename[: -len(file.suffix)] if file.suffix else filename
            c = clean(name_without_ext)

            if is_site_logo(filename):
                print(f"SKIP (site logo): {filename}")
                continue

            if is_profile_picture(filename):
                if not sellers:
                    skipped.append(filename)
                    print(f"SKIP (no sellers): {filename}")
                    continue
                ordinal = seller_number_from_filename(filename)
                seller = sellers[ordinal - 1] if ordinal <= len(sellers) else sellers[0]
                seller.logo_url = f"/uploads/{filename}"
                mapped_sellers += 1
                print(f"MAPPED seller #{seller.id} ({seller.name}) -> {filename}")
                continue

            # Product image: match cleaned filename inside cleaned product name.
            matches = []
            for product in products:
                prod_clean = clean(product.name)
                if c in prod_clean and product.id not in assigned_product_ids:
                    matches.append(product)

            if not matches:
                skipped.append(filename)
                print(f"SKIP (no matching product): {filename}")
                continue

            # Prefer the lowest-id product that matches.
            product = min(matches, key=lambda p: p.id)
            product.image_url = f"/uploads/{filename}"
            assigned_product_ids.add(product.id)
            mapped_products += 1
            print(f"MAPPED product #{product.id} ({product.name}) -> {filename}")

        db.commit()
        print(f"\nDone: {mapped_products} products and {mapped_sellers} sellers mapped.")
        if skipped:
            print(f"Skipped files: {', '.join(skipped)}")
            print("Rename them to match a product name, e.g. 'prohoodie.jpg' for 'Pro Hoodie', and re-run.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
