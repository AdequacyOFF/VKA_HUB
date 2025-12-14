"""Add priority, moderator_response, and response_read to platform_complaints

Revision ID: 010
Revises: 009
Create Date: 2025-12-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new fields to platform_complaints table"""

    # Create the priority enum
    priority_enum = postgresql.ENUM(
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
        name='complaintpriority',
        create_type=True
    )
    priority_enum.create(op.get_bind(), checkfirst=True)

    # Add priority column with default 'medium'
    op.add_column(
        'platform_complaints',
        sa.Column('priority', priority_enum, server_default='MEDIUM', nullable=False)
    )

    # Add moderator_response column (nullable)
    op.add_column(
        'platform_complaints',
        sa.Column('moderator_response', sa.Text(), nullable=True)
    )

    # Add response_read column with default False
    op.add_column(
        'platform_complaints',
        sa.Column('response_read', sa.Boolean(), server_default='false', nullable=False)
    )


def downgrade() -> None:
    """Remove new fields from platform_complaints table"""

    # Drop columns
    op.drop_column('platform_complaints', 'response_read')
    op.drop_column('platform_complaints', 'moderator_response')
    op.drop_column('platform_complaints', 'priority')

    # Drop enum type
    postgresql.ENUM(name='complaintpriority').drop(op.get_bind(), checkfirst=True)
