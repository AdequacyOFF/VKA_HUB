"""Add reviewed_by and reviewed_at to competition_registrations

Revision ID: 023
Revises: 022
Create Date: 2026-01-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '023'
down_revision: Union[str, None] = '022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add reviewed_by and reviewed_at columns to competition_registrations
    op.add_column(
        'competition_registrations',
        sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    )
    op.add_column(
        'competition_registrations',
        sa.Column('reviewed_at', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    # Remove the columns
    op.drop_column('competition_registrations', 'reviewed_at')
    op.drop_column('competition_registrations', 'reviewed_by')
