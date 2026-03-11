"""Expand default roles and skills with cybersecurity options

Revision ID: 024
Revises: 023
Create Date: 2026-03-11 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import column, table


# revision identifiers
revision: str = "024"
down_revision: Union[str, None] = "023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NEW_ROLES = [
    "devsecops",
    "secops",
    "security_engineer",
    "security_analyst",
    "security_architect",
    "security_researcher",
    "appsec",
    "cloud_security",
    "network_security",
    "iam",
    "soc_analyst",
    "incident_responder",
    "threat_hunter",
    "threat_intelligence",
    "pentester",
    "red_team",
    "blue_team",
    "malware_analyst",
    "digital_forensics",
    "grc",
    "compliance",
]


NEW_SKILLS = [
    "devsecops",
    "secure_sdlc",
    "owasp",
    "sast",
    "dast",
    "sca",
    "container_security",
    "kubernetes_security",
    "secrets_management",
    "threat_modeling",
    "iam",
    "sso",
    "oauth2_oidc",
    "zero_trust",
    "siem",
    "soar",
    "edr_xdr",
    "ids_ips",
    "waf",
    "vulnerability_assessment",
    "vulnerability_management",
    "penetration_testing",
    "incident_response",
    "threat_hunting",
    "threat_intelligence",
    "malware_analysis",
    "digital_forensics",
    "reverse_engineering",
    "osint",
    "yara",
    "sigma",
    "splunk",
    "elastic_security",
    "wireshark",
    "nmap",
    "burp_suite",
    "metasploit",
    "nessus",
    "snort",
    "suricata",
    "osquery",
    "pki_tls",
    "cryptography",
    "cloud_security",
    "network_security",
    "compliance",
]


def _insert_missing(table_name: str, names: list[str]) -> None:
    bind = op.get_bind()
    now = datetime.utcnow()
    records_table = table(
        table_name,
        column("name", sa.String),
        column("is_custom", sa.Boolean),
        column("created_at", sa.DateTime),
    )

    existing_names = {
        row[0]
        for row in bind.execute(
            sa.text(f"SELECT name FROM {table_name} WHERE name IN :names").bindparams(
                sa.bindparam("names", expanding=True)
            ),
            {"names": names},
        )
    }

    missing_rows = [
        {"name": name, "is_custom": False, "created_at": now}
        for name in names
        if name not in existing_names
    ]

    if missing_rows:
        op.bulk_insert(records_table, missing_rows)


def upgrade() -> None:
    _insert_missing("roles", NEW_ROLES)
    _insert_missing("skills", NEW_SKILLS)


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "DELETE FROM user_skills "
            "WHERE skill_id IN (SELECT id FROM skills WHERE is_custom = false AND name IN :names)"
        ).bindparams(sa.bindparam("names", expanding=True)),
        {"names": NEW_SKILLS},
    )
    bind.execute(
        sa.text(
            "DELETE FROM user_roles "
            "WHERE role_id IN (SELECT id FROM roles WHERE is_custom = false AND name IN :names)"
        ).bindparams(sa.bindparam("names", expanding=True)),
        {"names": NEW_ROLES},
    )
    bind.execute(
        sa.text("DELETE FROM skills WHERE is_custom = false AND name IN :names").bindparams(
            sa.bindparam("names", expanding=True)
        ),
        {"names": NEW_SKILLS},
    )
    bind.execute(
        sa.text("DELETE FROM roles WHERE is_custom = false AND name IN :names").bindparams(
            sa.bindparam("names", expanding=True)
        ),
        {"names": NEW_ROLES},
    )
