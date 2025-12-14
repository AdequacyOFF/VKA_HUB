"""Add competition stages and cases tables

Revision ID: 005
Revises: 004
Create Date: 2025-12-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new columns to competitions table and create new tables for stages and cases"""

    # Add new columns to competitions table
    op.add_column('competitions', sa.Column('other_type_description', sa.String(length=255), nullable=True))
    op.add_column('competitions', sa.Column('min_team_size', sa.Integer(), nullable=False, server_default='2'))
    op.add_column('competitions', sa.Column('max_team_size', sa.Integer(), nullable=False, server_default='5'))

    # Create competition_stages table
    op.create_table(
        'competition_stages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('stage_number', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_competition_stages_id'), 'competition_stages', ['id'], unique=False)

    # Create competition_cases table
    op.create_table(
        'competition_cases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('competition_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('knowledge_stack', postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column('case_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['competition_id'], ['competitions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_competition_cases_id'), 'competition_cases', ['id'], unique=False)


def downgrade() -> None:
    """Remove stages and cases tables and drop new columns from competitions"""

    # Drop competition_cases table
    op.drop_index(op.f('ix_competition_cases_id'), table_name='competition_cases')
    op.drop_table('competition_cases')

    # Drop competition_stages table
    op.drop_index(op.f('ix_competition_stages_id'), table_name='competition_stages')
    op.drop_table('competition_stages')

    # Remove columns from competitions table
    op.drop_column('competitions', 'max_team_size')
    op.drop_column('competitions', 'min_team_size')
    op.drop_column('competitions', 'other_type_description')
