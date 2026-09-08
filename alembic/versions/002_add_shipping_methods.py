"""add shipping methods and selected address method

Revision ID: 002
Revises: 83929a864b5e
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "83929a864b5e"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if "shipping_methods" not in tables:
        op.create_table(
            "shipping_methods",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(), nullable=False, unique=True),
            sa.Column("price", sa.Float(), nullable=False, server_default="0"),
            sa.Column("delivery_estimate", sa.String(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    address_columns = {column["name"] for column in inspector.get_columns("addresses")}
    if "shipping_method_id" not in address_columns:
        op.add_column("addresses", sa.Column("shipping_method_id", sa.Integer(), nullable=True))
        op.create_foreign_key("fk_addresses_shipping_method", "addresses", "shipping_methods", ["shipping_method_id"], ["id"])
    methods = sa.table("shipping_methods", sa.column("name", sa.String), sa.column("price", sa.Float), sa.column("delivery_estimate", sa.String), sa.column("is_active", sa.Boolean))
    existing_names = {row[0] for row in bind.execute(sa.text("SELECT name FROM shipping_methods"))}
    defaults = [
        {"name": "Free Shipping", "price": 0, "delivery_estimate": "Between 2 - 5 working days", "is_active": True},
        {"name": "Next Day Delivery", "price": 100, "delivery_estimate": "24 hours from checkout", "is_active": True},
    ]
    missing = [method for method in defaults if method["name"] not in existing_names]
    if missing:
        op.bulk_insert(methods, missing)

def downgrade():
    op.drop_constraint("fk_addresses_shipping_method", "addresses", type_="foreignkey")
    op.drop_column("addresses", "shipping_method_id")
    op.drop_table("shipping_methods")
