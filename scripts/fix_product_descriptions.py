"""
Replace the generic 'Demo product ... for Vend API testing' descriptions
with realistic marketplace descriptions.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Local_Session
from app import models

TEMPLATES = [
    "Discover the {name}. Premium quality, fast delivery, and easy returns only at Faraz.",
    "The {name} is a great addition to your collection. Shop now with secure checkout and reliable shipping.",
    "Upgrade your everyday routine with the {name}. Handpicked for Faraz customers at a competitive price.",
    "Get the {name} today. Durable, practical, and backed by friendly Faraz support.",
    "Experience the {name} — a trusted choice for value and quality. Order from Faraz with confidence.",
]


def main():
    db = Local_Session()
    try:
        products = db.query(models.Product).all()
        updated = 0
        for index, product in enumerate(products):
            if not product.description or "Demo product" in product.description:
                template = TEMPLATES[index % len(TEMPLATES)]
                product.description = template.format(name=product.name)
                updated += 1
        db.commit()
        print(f"Updated {updated} product descriptions.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
