"""Add direction to teams

Revision ID: 018
Revises: 017
Create Date: 2025-12-26 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '018'
down_revision: Union[str, None] = '017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add direction column to teams table"""
    op.add_column('teams', sa.Column('direction', sa.String(100), nullable=False, server_default='Другое'))


def downgrade() -> None:
    """Remove direction column from teams table"""
    op.drop_column('teams', 'direction')
