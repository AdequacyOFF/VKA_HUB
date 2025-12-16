"""Add invited_by to team_join_requests

Revision ID: 012
Revises: 011
Create Date: 2025-01-15 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '012'
down_revision: Union[str, None] = '011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add invited_by column to team_join_requests table"""

    # Add invited_by column
    op.add_column('team_join_requests',
        sa.Column('invited_by', sa.Integer(), nullable=True)
    )

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_team_join_requests_invited_by_users',
        'team_join_requests', 'users',
        ['invited_by'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Remove invited_by column from team_join_requests table"""

    # Drop foreign key constraint
    op.drop_constraint('fk_team_join_requests_invited_by_users', 'team_join_requests', type_='foreignkey')

    # Drop invited_by column
    op.drop_column('team_join_requests', 'invited_by')
