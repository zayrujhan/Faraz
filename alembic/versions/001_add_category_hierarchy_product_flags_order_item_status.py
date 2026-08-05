"""add category hierarchy product flags order item status

Revision ID: 001
Revises:
Create Date: 2026-08-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("categories", sa.Column("parent_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_categories_parent_id",
        "categories",
        "categories",
        ["parent_id"],
        ["id"],
    )

    op.add_column(
        "products",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "products",
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    op.add_column(
        "order_items",
        sa.Column("status", sa.String(), nullable=False, server_default="Pending"),
    )

    op.alter_column("products", "is_active", server_default=None)
    op.alter_column("order_items", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("order_items", "status")
    op.drop_column("products", "created_at")
    op.drop_column("products", "is_active")
    op.drop_constraint("fk_categories_parent_id", "categories", type_="foreignkey")
    op.drop_column("categories", "parent_id")
