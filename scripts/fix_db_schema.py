"""
One-time fix: add missing columns/tables that are in the models but not in the database.
Run this when the backend DB is slightly out of sync with migrations.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine, Base
from app import models


def add_column(table, column, definition):
    with engine.connect() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}"))
        conn.commit()
    print(f"Ensured {table}.{column} exists.")


def create_missing_tables():
    Base.metadata.create_all(bind=engine)
    print("Created any missing tables via Base.metadata.create_all.")


if __name__ == "__main__":
    # Addresses needs shipping_method_id to support the shipping/payment checkout flow.
    add_column("addresses", "shipping_method_id", "INTEGER")
    # Ensure new chat usage table exists.
    create_missing_tables()
    print("Done.")
