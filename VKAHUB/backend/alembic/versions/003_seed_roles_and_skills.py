"""Seed default roles and skills

Revision ID: 003
Revises: 002
Create Date: 2025-01-07 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from datetime import datetime

# revision identifiers
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed default roles and skills"""

    # Define tables for bulk insert
    roles_table = table('roles',
        column('name', sa.String),
        column('is_custom', sa.Boolean),
        column('created_at', sa.DateTime)
    )

    skills_table = table('skills',
        column('name', sa.String),
        column('is_custom', sa.Boolean),
        column('created_at', sa.DateTime)
    )

    now = datetime.utcnow()

    # Insert default roles
    default_roles = [
        {'name': 'backend', 'is_custom': False, 'created_at': now},
        {'name': 'frontend', 'is_custom': False, 'created_at': now},
        {'name': 'devops', 'is_custom': False, 'created_at': now},
        {'name': 'ds', 'is_custom': False, 'created_at': now},
        {'name': 'ml', 'is_custom': False, 'created_at': now},
        {'name': 'qa', 'is_custom': False, 'created_at': now},
        {'name': 'ui_ux', 'is_custom': False, 'created_at': now},
        {'name': 'mobile', 'is_custom': False, 'created_at': now},
        {'name': 'gamedev', 'is_custom': False, 'created_at': now},
        {'name': 'analytics', 'is_custom': False, 'created_at': now},
        {'name': 'pm', 'is_custom': False, 'created_at': now},
        {'name': 'architect', 'is_custom': False, 'created_at': now},
    ]

    # Insert default skills
    default_skills = [
        # Programming Languages
        {'name': 'python', 'is_custom': False, 'created_at': now},
        {'name': 'javascript', 'is_custom': False, 'created_at': now},
        {'name': 'typescript', 'is_custom': False, 'created_at': now},
        {'name': 'java', 'is_custom': False, 'created_at': now},
        {'name': 'csharp', 'is_custom': False, 'created_at': now},
        {'name': 'cpp', 'is_custom': False, 'created_at': now},
        {'name': 'go', 'is_custom': False, 'created_at': now},
        {'name': 'rust', 'is_custom': False, 'created_at': now},
        {'name': 'php', 'is_custom': False, 'created_at': now},
        {'name': 'ruby', 'is_custom': False, 'created_at': now},
        {'name': 'swift', 'is_custom': False, 'created_at': now},
        {'name': 'kotlin', 'is_custom': False, 'created_at': now},

        # Frontend Frameworks
        {'name': 'react', 'is_custom': False, 'created_at': now},
        {'name': 'vue', 'is_custom': False, 'created_at': now},
        {'name': 'angular', 'is_custom': False, 'created_at': now},
        {'name': 'svelte', 'is_custom': False, 'created_at': now},
        {'name': 'nextjs', 'is_custom': False, 'created_at': now},

        # Backend Frameworks
        {'name': 'django', 'is_custom': False, 'created_at': now},
        {'name': 'fastapi', 'is_custom': False, 'created_at': now},
        {'name': 'flask', 'is_custom': False, 'created_at': now},
        {'name': 'nodejs', 'is_custom': False, 'created_at': now},
        {'name': 'express', 'is_custom': False, 'created_at': now},
        {'name': 'nestjs', 'is_custom': False, 'created_at': now},
        {'name': 'spring', 'is_custom': False, 'created_at': now},
        {'name': 'dotnet', 'is_custom': False, 'created_at': now},

        # Databases
        {'name': 'postgresql', 'is_custom': False, 'created_at': now},
        {'name': 'mysql', 'is_custom': False, 'created_at': now},
        {'name': 'mongodb', 'is_custom': False, 'created_at': now},
        {'name': 'redis', 'is_custom': False, 'created_at': now},
        {'name': 'elasticsearch', 'is_custom': False, 'created_at': now},

        # DevOps & Tools
        {'name': 'docker', 'is_custom': False, 'created_at': now},
        {'name': 'kubernetes', 'is_custom': False, 'created_at': now},
        {'name': 'git', 'is_custom': False, 'created_at': now},
        {'name': 'linux', 'is_custom': False, 'created_at': now},
        {'name': 'ci_cd', 'is_custom': False, 'created_at': now},
        {'name': 'aws', 'is_custom': False, 'created_at': now},
        {'name': 'azure', 'is_custom': False, 'created_at': now},
        {'name': 'gcp', 'is_custom': False, 'created_at': now},

        # ML/DS
        {'name': 'tensorflow', 'is_custom': False, 'created_at': now},
        {'name': 'pytorch', 'is_custom': False, 'created_at': now},
        {'name': 'scikit_learn', 'is_custom': False, 'created_at': now},
        {'name': 'pandas', 'is_custom': False, 'created_at': now},
        {'name': 'numpy', 'is_custom': False, 'created_at': now},

        # Design
        {'name': 'figma', 'is_custom': False, 'created_at': now},
        {'name': 'sketch', 'is_custom': False, 'created_at': now},
        {'name': 'adobe_xd', 'is_custom': False, 'created_at': now},
    ]

    op.bulk_insert(roles_table, default_roles)
    op.bulk_insert(skills_table, default_skills)


def downgrade() -> None:
    """Remove default roles and skills"""
    op.execute("DELETE FROM user_skills WHERE skill_id IN (SELECT id FROM skills WHERE is_custom = false)")
    op.execute("DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE is_custom = false)")
    op.execute("DELETE FROM skills WHERE is_custom = false")
    op.execute("DELETE FROM roles WHERE is_custom = false")
