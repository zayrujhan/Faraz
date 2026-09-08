"""add seller profile and product image fields

Revision ID: 002
Revises: 001
Create Date: 2026-09-08
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('store_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('store_description', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('logo_url', sa.String(), nullable=True))
    op.add_column('products', sa.Column('image_url', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('products', 'image_url')
    op.drop_column('users', 'logo_url')
    op.drop_column('users', 'store_description')
    op.drop_column('users', 'store_name')
