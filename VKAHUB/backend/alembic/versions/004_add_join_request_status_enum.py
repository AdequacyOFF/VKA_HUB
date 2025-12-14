"""Add JoinRequestStatus ENUM type

Revision ID: 004
Revises: 003
Create Date: 2025-12-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create ENUM type and convert status column to use it"""

    # Create the ENUM type
    join_request_status_enum = postgresql.ENUM('pending', 'approved', 'rejected', name='joinrequeststatus', create_type=True)
    join_request_status_enum.create(op.get_bind(), checkfirst=True)

    # Step 1: Drop the default value
    op.execute("ALTER TABLE team_join_requests ALTER COLUMN status DROP DEFAULT")

    # Step 2: Convert the column type using USING to cast existing values
    op.execute("""
        ALTER TABLE team_join_requests
        ALTER COLUMN status TYPE joinrequeststatus
        USING status::joinrequeststatus
    """)

    # Step 3: Set the default value with the ENUM type
    op.execute("ALTER TABLE team_join_requests ALTER COLUMN status SET DEFAULT 'pending'::joinrequeststatus")


def downgrade() -> None:
    """Convert status column back to string and drop ENUM type"""

    # Step 1: Drop the ENUM default
    op.execute("ALTER TABLE team_join_requests ALTER COLUMN status DROP DEFAULT")

    # Step 2: Convert column back to string
    op.execute("""
        ALTER TABLE team_join_requests
        ALTER COLUMN status TYPE VARCHAR(20)
        USING status::text
    """)

    # Step 3: Set string default
    op.execute("ALTER TABLE team_join_requests ALTER COLUMN status SET DEFAULT 'pending'")

    # Step 4: Drop the ENUM type
    postgresql.ENUM(name='joinrequeststatus').drop(op.get_bind(), checkfirst=True)
