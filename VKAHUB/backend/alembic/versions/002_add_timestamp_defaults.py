"""Add timestamp defaults

Revision ID: 002
Revises: 001
Create Date: 2025-01-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add server_default=now() to all timestamp columns"""

    # Users table
    op.alter_column('users', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('users', 'updated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Roles table
    op.alter_column('roles', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Skills table
    op.alter_column('skills', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Teams table
    op.alter_column('teams', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('teams', 'updated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Certificates table
    op.alter_column('certificates', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('certificates', 'updated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competitions table
    op.alter_column('competitions', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('competitions', 'updated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competition Registrations table
    op.alter_column('competition_registrations', 'applied_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('competition_registrations', 'updated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Team Join Requests table
    op.alter_column('team_join_requests', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('team_join_requests', 'updated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # User Roles table
    op.alter_column('user_roles', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # User Skills table
    op.alter_column('user_skills', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Team Members table
    op.alter_column('team_members', 'joined_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Moderators table
    op.alter_column('moderators', 'assigned_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competition Team Members table
    op.alter_column('competition_team_members', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competition Reports table
    op.alter_column('competition_reports', 'submitted_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Moderator Reports table
    op.alter_column('moderator_reports', 'generated_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Logs table
    op.alter_column('logs', 'created_at',
                   server_default=sa.text('now()'),
                   existing_type=sa.DateTime(),
                   existing_nullable=False)


def downgrade() -> None:
    """Remove server_default from all timestamp columns"""

    # Users table
    op.alter_column('users', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('users', 'updated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Roles table
    op.alter_column('roles', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Skills table
    op.alter_column('skills', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Teams table
    op.alter_column('teams', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('teams', 'updated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Certificates table
    op.alter_column('certificates', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('certificates', 'updated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competitions table
    op.alter_column('competitions', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('competitions', 'updated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competition Registrations table
    op.alter_column('competition_registrations', 'applied_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('competition_registrations', 'updated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Team Join Requests table
    op.alter_column('team_join_requests', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
    op.alter_column('team_join_requests', 'updated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # User Roles table
    op.alter_column('user_roles', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # User Skills table
    op.alter_column('user_skills', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Team Members table
    op.alter_column('team_members', 'joined_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Moderators table
    op.alter_column('moderators', 'assigned_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competition Team Members table
    op.alter_column('competition_team_members', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Competition Reports table
    op.alter_column('competition_reports', 'submitted_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Moderator Reports table
    op.alter_column('moderator_reports', 'generated_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)

    # Logs table
    op.alter_column('logs', 'created_at',
                   server_default=None,
                   existing_type=sa.DateTime(),
                   existing_nullable=False)
