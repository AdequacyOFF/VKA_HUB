"""Change competition dates to datetime

Revision ID: 020
Revises: 019
Create Date: 2025-12-26 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '020'
down_revision: Union[str, None] = '019'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change start_date and end_date from DATE to TIMESTAMP in competitions table"""

    # For PostgreSQL, we need to:
    # 1. Add new TIMESTAMP columns
    # 2. Copy data from DATE columns, setting time to midnight
    # 3. Drop old DATE columns
    # 4. Rename new columns to original names

    # Add temporary TIMESTAMP columns
    op.add_column('competitions',
        sa.Column('start_date_temp', sa.DateTime(), nullable=True)
    )
    op.add_column('competitions',
        sa.Column('end_date_temp', sa.DateTime(), nullable=True)
    )

    # Copy data from DATE to TIMESTAMP columns (DATE values become midnight timestamps)
    op.execute("""
        UPDATE competitions
        SET start_date_temp = start_date::timestamp,
            end_date_temp = end_date::timestamp
    """)

    # Drop old DATE columns
    op.drop_column('competitions', 'start_date')
    op.drop_column('competitions', 'end_date')

    # Rename temporary columns to final names
    op.alter_column('competitions', 'start_date_temp',
        new_column_name='start_date',
        nullable=False
    )
    op.alter_column('competitions', 'end_date_temp',
        new_column_name='end_date',
        nullable=False
    )


def downgrade() -> None:
    """Revert start_date and end_date from TIMESTAMP back to DATE"""

    # Add temporary DATE columns
    op.add_column('competitions',
        sa.Column('start_date_temp', sa.Date(), nullable=True)
    )
    op.add_column('competitions',
        sa.Column('end_date_temp', sa.Date(), nullable=True)
    )

    # Copy data from TIMESTAMP to DATE columns (time part is truncated)
    op.execute("""
        UPDATE competitions
        SET start_date_temp = start_date::date,
            end_date_temp = end_date::date
    """)

    # Drop TIMESTAMP columns
    op.drop_column('competitions', 'start_date')
    op.drop_column('competitions', 'end_date')

    # Rename temporary columns to final names
    op.alter_column('competitions', 'start_date_temp',
        new_column_name='start_date',
        nullable=False
    )
    op.alter_column('competitions', 'end_date_temp',
        new_column_name='end_date',
        nullable=False
    )
