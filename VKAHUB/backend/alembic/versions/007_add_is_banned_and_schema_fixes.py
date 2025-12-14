"""Add is_banned field to users

Revision ID: 007
Revises: 006
Create Date: 2025-12-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    """Add is_banned column to users table"""

    # 1. Add is_banned column to users table
    op.add_column(
        'users',
        sa.Column('is_banned', sa.Boolean(), server_default='false', nullable=False)
    )

    # 2. Fix team_reports foreign key constraints (only if table exists)
    if table_exists('team_reports'):
        # Drop existing foreign keys
        op.drop_constraint('team_reports_team_id_fkey', 'team_reports', type_='foreignkey')
        op.drop_constraint('team_reports_author_id_fkey', 'team_reports', type_='foreignkey')

        # Make author_id nullable (for SET NULL behavior)
        op.alter_column('team_reports', 'author_id',
                        existing_type=sa.Integer(),
                        nullable=True)

        # Recreate foreign keys with proper cascade behavior
        op.create_foreign_key(
            'team_reports_team_id_fkey',
            'team_reports', 'teams',
            ['team_id'], ['id'],
            ondelete='CASCADE'
        )
        op.create_foreign_key(
            'team_reports_author_id_fkey',
            'team_reports', 'users',
            ['author_id'], ['id'],
            ondelete='SET NULL'
        )


def downgrade() -> None:
    """Remove is_banned column"""

    # 1. Remove is_banned column
    op.drop_column('users', 'is_banned')

    # 2. Revert team_reports foreign key constraints (only if table exists)
    if table_exists('team_reports'):
        op.drop_constraint('team_reports_team_id_fkey', 'team_reports', type_='foreignkey')
        op.drop_constraint('team_reports_author_id_fkey', 'team_reports', type_='foreignkey')

        # Make author_id non-nullable again
        op.alter_column('team_reports', 'author_id',
                        existing_type=sa.Integer(),
                        nullable=False)

        # Recreate foreign keys without cascade
        op.create_foreign_key(
            'team_reports_team_id_fkey',
            'team_reports', 'teams',
            ['team_id'], ['id']
        )
        op.create_foreign_key(
            'team_reports_author_id_fkey',
            'team_reports', 'users',
            ['author_id'], ['id']
        )
