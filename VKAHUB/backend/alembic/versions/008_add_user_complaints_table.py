"""Add user_complaints table for moderation

Revision ID: 008
Revises: 007
Create Date: 2025-12-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '008'
down_revision: Union[str, None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create user_complaints table"""

    # Create the complaint status enum
    complaint_status_enum = postgresql.ENUM('pending', 'resolved', 'rejected', name='complaintstatus', create_type=False)
    complaint_status_enum.create(op.get_bind(), checkfirst=True)

    # Create user_complaints table
    op.create_table(
        'user_complaints',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('reporter_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reason', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', complaint_status_enum, server_default='pending', nullable=False),
        sa.Column('resolved_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes
    op.create_index('ix_user_complaints_id', 'user_complaints', ['id'])
    op.create_index('ix_user_complaints_status', 'user_complaints', ['status'])
    op.create_index('ix_user_complaints_created_at', 'user_complaints', ['created_at'])


def downgrade() -> None:
    """Drop user_complaints table"""

    # Drop indexes
    op.drop_index('ix_user_complaints_created_at', 'user_complaints')
    op.drop_index('ix_user_complaints_status', 'user_complaints')
    op.drop_index('ix_user_complaints_id', 'user_complaints')

    # Drop table
    op.drop_table('user_complaints')

    # Drop enum type
    postgresql.ENUM(name='complaintstatus').drop(op.get_bind(), checkfirst=True)
