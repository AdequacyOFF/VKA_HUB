"""Certificate repository implementation"""

from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.certificate_repository import CertificateRepository
from app.domain.models.certificate import Certificate


class CertificateRepositoryImpl(CertificateRepository):
    """SQLAlchemy implementation of Certificate repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, certificate_data: Dict[str, Any]) -> Certificate:
        """Create a new certificate"""
        certificate = Certificate(**certificate_data)
        self.db.add(certificate)
        await self.db.flush()
        await self.db.refresh(certificate)
        return certificate

    async def get_by_id(self, certificate_id: int) -> Optional[Certificate]:
        """Get certificate by ID"""
        result = await self.db.execute(
            select(Certificate).where(Certificate.id == certificate_id)
        )
        return result.scalar_one_or_none()

    async def update(self, certificate_id: int, certificate_data: Dict[str, Any]) -> Optional[Certificate]:
        """Update certificate"""
        certificate = await self.get_by_id(certificate_id)
        if not certificate:
            return None

        for key, value in certificate_data.items():
            setattr(certificate, key, value)

        await self.db.flush()
        await self.db.refresh(certificate)
        return certificate

    async def delete(self, certificate_id: int) -> bool:
        """Delete certificate"""
        certificate = await self.get_by_id(certificate_id)
        if not certificate:
            return False

        await self.db.delete(certificate)
        await self.db.flush()
        return True

    async def list_by_user(self, user_id: int) -> List[Certificate]:
        """List all certificates for a user"""
        result = await self.db.execute(
            select(Certificate)
            .where(Certificate.user_id == user_id)
            .order_by(Certificate.date.desc())
        )
        return list(result.scalars().all())
