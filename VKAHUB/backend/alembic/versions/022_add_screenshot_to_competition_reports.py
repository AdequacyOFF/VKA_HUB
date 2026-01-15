"""Add screenshot_url to competition_reports

Revision ID: 022
Revises: 021
Create Date: 2026-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = '022'
down_revision: Union[str, None] = '021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add screenshot_url column to competition_reports table"""
    op.add_column(
        'competition_reports',
        sa.Column('screenshot_url', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Remove screenshot_url column"""
    op.drop_column('competition_reports', 'screenshot_url')
