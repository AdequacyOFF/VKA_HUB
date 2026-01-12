"""Add case_id to competition_registrations

Revision ID: 013
Revises: 012
Create Date: 2025-01-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '013'
down_revision: Union[str, None] = '012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add case_id column to competition_registrations table"""

    # Add case_id column
    op.add_column('competition_registrations',
        sa.Column('case_id', sa.Integer(), nullable=True)
    )

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_competition_registrations_case_id_competition_cases',
        'competition_registrations', 'competition_cases',
        ['case_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Remove case_id column from competition_registrations table"""

    # Drop foreign key constraint
    op.drop_constraint('fk_competition_registrations_case_id_competition_cases', 'competition_registrations', type_='foreignkey')

    # Drop case_id column
    op.drop_column('competition_registrations', 'case_id')
