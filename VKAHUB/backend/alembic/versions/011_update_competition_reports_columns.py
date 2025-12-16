"""Update competition_reports columns

Revision ID: 011
Revises: 010
Create Date: 2025-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '011'
down_revision: Union[str, None] = '010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns to competition_reports table"""

    # Add git_link column
    op.add_column('competition_reports',
        sa.Column('git_link', sa.Text(), nullable=True)
    )

    # Add presentation_url column
    op.add_column('competition_reports',
        sa.Column('presentation_url', sa.Text(), nullable=True)
    )

    # Add placement column
    op.add_column('competition_reports',
        sa.Column('placement', sa.Integer(), nullable=True)
    )

    # Rename summary to brief_summary
    op.alter_column('competition_reports', 'summary',
        new_column_name='brief_summary',
        existing_type=sa.Text(),
        existing_nullable=False
    )


def downgrade() -> None:
    """Remove added columns from competition_reports table"""

    # Rename brief_summary back to summary
    op.alter_column('competition_reports', 'brief_summary',
        new_column_name='summary',
        existing_type=sa.Text(),
        existing_nullable=False
    )

    # Drop placement column
    op.drop_column('competition_reports', 'placement')

    # Drop presentation_url column
    op.drop_column('competition_reports', 'presentation_url')

    # Drop git_link column
    op.drop_column('competition_reports', 'git_link')
