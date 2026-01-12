"""Add result and project_url to competition_reports

Revision ID: 019
Revises: 018
Create Date: 2025-12-26 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '019'
down_revision: Union[str, None] = '018'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add result enum and project_url to competition_reports table"""

    # Create enum type for competition result
    competitionresult = sa.Enum(
        'FIRST_PLACE',
        'SECOND_PLACE',
        'THIRD_PLACE',
        'FINALIST',
        'SEMI_FINALIST',
        'DID_NOT_PASS',
        name='competitionresult',
        native_enum=True
    )
    competitionresult.create(op.get_bind(), checkfirst=True)

    # Add result column (required)
    op.add_column('competition_reports',
        sa.Column('result', competitionresult, nullable=True)  # Temporarily nullable for migration
    )

    # Add project_url column (optional)
    op.add_column('competition_reports',
        sa.Column('project_url', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Remove result and project_url from competition_reports table"""

    # Drop project_url column
    op.drop_column('competition_reports', 'project_url')

    # Drop result column
    op.drop_column('competition_reports', 'result')

    # Drop enum type
    sa.Enum(name='competitionresult').drop(op.get_bind(), checkfirst=True)
