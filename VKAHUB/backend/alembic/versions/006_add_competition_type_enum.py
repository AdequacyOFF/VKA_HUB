"""Add CompetitionType ENUM type

Revision ID: 006
Revises: 005
Create Date: 2025-12-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create ENUM type and convert type column to use it"""

    # Create the ENUM type
    competition_type_enum = postgresql.ENUM(
        'hackathon', 'CTF', 'other',
        name='competitiontype',
        create_type=True
    )
    competition_type_enum.create(op.get_bind(), checkfirst=True)

    # Convert the column type using USING to cast existing values
    op.execute("""
        ALTER TABLE competitions
        ALTER COLUMN type TYPE competitiontype
        USING type::competitiontype
    """)


def downgrade() -> None:
    """Convert type column back to string and drop ENUM type"""

    # Convert column back to string
    op.execute("""
        ALTER TABLE competitions
        ALTER COLUMN type TYPE VARCHAR(20)
        USING type::text
    """)

    # Drop the ENUM type
    postgresql.ENUM(name='competitiontype').drop(op.get_bind(), checkfirst=True)
