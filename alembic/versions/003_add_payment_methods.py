"""add payment method catalog

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    if "payment_methods" not in sa.inspect(bind).get_table_names():
        op.create_table(
            "payment_methods",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(), nullable=False, unique=True),
            sa.Column("description", sa.String(), nullable=False),
            sa.Column("requires_card_details", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    methods = sa.table("payment_methods", sa.column("name", sa.String), sa.column("description", sa.String), sa.column("requires_card_details", sa.Boolean), sa.column("is_active", sa.Boolean))
    existing = {row[0] for row in bind.execute(sa.text("SELECT name FROM payment_methods"))}
    defaults = [
        {"name": "Credit Card", "description": "Pay securely with your card.", "requires_card_details": True, "is_active": True},
        {"name": "bKash", "description": "Mobile banking service.", "requires_card_details": False, "is_active": True},
    ]
    missing = [method for method in defaults if method["name"] not in existing]
    if missing:
        op.bulk_insert(methods, missing)

def downgrade():
    op.drop_table("payment_methods")
