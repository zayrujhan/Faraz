"""
One-time script: assign deterministic placeholder images to every product that does not have one.

Run after seeding the database:

    python scripts/seed_images.py

This avoids uploading 1000 files manually. Each product gets a unique image from a public placeholder service.
"""
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database import Local_Session
from app import models

PLACEHOLDER = "https://picsum.photos/seed"


def main():
    db = Local_Session()
    try:
        products = db.query(models.Product).all()
        updated = 0
        for product in products:
            if not product.image_url:
                product.image_url = f"{PLACEHOLDER}/{product.id}/400/400"
                updated += 1
        db.commit()
        print(f"Assigned placeholder images to {updated} products.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
