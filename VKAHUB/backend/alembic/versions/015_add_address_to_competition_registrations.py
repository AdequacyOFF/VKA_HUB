"""Add address to competition_registrations

Revision ID: 015
Revises: 014
Create Date: 2025-12-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '015'
down_revision: Union[str, None] = '014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add address column to competition_registrations table"""

    # Add address column
    op.add_column('competition_registrations',
        sa.Column('address', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Remove address column from competition_registrations table"""

    # Drop address column
    op.drop_column('competition_registrations', 'address')
