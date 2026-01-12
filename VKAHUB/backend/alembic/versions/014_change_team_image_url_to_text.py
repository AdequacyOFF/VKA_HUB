"""Change team image_url to TEXT

Revision ID: 014
Revises: 013
Create Date: 2025-01-20 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '014'
down_revision: Union[str, None] = '013'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change image_url column from VARCHAR(500) to TEXT"""
    # PostgreSQL allows changing column type with ALTER TABLE
    op.execute('ALTER TABLE teams ALTER COLUMN image_url TYPE TEXT')


def downgrade() -> None:
    """Change image_url column back from TEXT to VARCHAR(500)"""
    # Note: This may fail if any values are longer than 500 characters
    op.execute('ALTER TABLE teams ALTER COLUMN image_url TYPE VARCHAR(500)')
