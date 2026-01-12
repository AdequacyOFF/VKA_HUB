"""Add organizer to competitions

Revision ID: 017
Revises: 016
Create Date: 2025-12-20 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '017'
down_revision: Union[str, None] = '016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add organizer column to competitions table"""

    # Add organizer column
    op.add_column('competitions',
        sa.Column('organizer', sa.String(500), nullable=True)
    )


def downgrade() -> None:
    """Remove organizer column from competitions table"""

    # Drop organizer column
    op.drop_column('competitions', 'organizer')
