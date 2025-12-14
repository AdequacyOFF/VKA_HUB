"""Add platform_complaints table for site feedback

Revision ID: 009
Revises: 008
Create Date: 2025-12-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '009'
down_revision: Union[str, None] = '008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create platform_complaints table"""

    # Create the platform complaint category enum
    platform_complaint_category_enum = postgresql.ENUM(
        'bug', 'feature_request', 'performance', 'ui_ux', 'security', 'other',
        name='platformcomplaintcategory',
        create_type=False
    )
    platform_complaint_category_enum.create(op.get_bind(), checkfirst=True)

    # The ComplaintStatus enum already exists from migration 008
    # We'll reuse it for consistency

    # Create platform_complaints table
    op.create_table(
        'platform_complaints',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', platform_complaint_category_enum, nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'resolved', 'rejected', name='complaintstatus', create_type=False), server_default='pending', nullable=False),
        sa.Column('resolved_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes
    op.create_index('ix_platform_complaints_id', 'platform_complaints', ['id'])
    op.create_index('ix_platform_complaints_status', 'platform_complaints', ['status'])
    op.create_index('ix_platform_complaints_created_at', 'platform_complaints', ['created_at'])


def downgrade() -> None:
    """Drop platform_complaints table"""

    # Drop indexes
    op.drop_index('ix_platform_complaints_created_at', 'platform_complaints')
    op.drop_index('ix_platform_complaints_status', 'platform_complaints')
    op.drop_index('ix_platform_complaints_id', 'platform_complaints')

    # Drop table
    op.drop_table('platform_complaints')

    # Drop enum type
    postgresql.ENUM(name='platformcomplaintcategory').drop(op.get_bind(), checkfirst=True)
