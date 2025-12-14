"""PlatformComplaint repository implementation"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.platform_complaint import PlatformComplaint, ComplaintStatus, PlatformComplaintCategory


class PlatformComplaintRepositoryImpl:
    """SQLAlchemy implementation of PlatformComplaint repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> PlatformComplaint:
        """Create a new platform complaint"""
        complaint = PlatformComplaint(**data)
        self.db.add(complaint)
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def get_by_id(self, complaint_id: int) -> Optional[PlatformComplaint]:
        """Get complaint by ID"""
        result = await self.db.execute(
            select(PlatformComplaint).where(PlatformComplaint.id == complaint_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[PlatformComplaint]:
        """List all platform complaints with optional filtering"""
        query = select(PlatformComplaint)

        if status:
            query = query.where(PlatformComplaint.status == status)

        if category:
            query = query.where(PlatformComplaint.category == category)

        # Order by created_at descending (newest first), pending first
        query = query.order_by(
            PlatformComplaint.status.asc(),  # pending comes first alphabetically
            PlatformComplaint.created_at.desc()
        )

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, status: Optional[str] = None, category: Optional[str] = None) -> int:
        """Count platform complaints with optional filtering"""
        query = select(func.count(PlatformComplaint.id))

        if status:
            query = query.where(PlatformComplaint.status == status)

        if category:
            query = query.where(PlatformComplaint.category == category)

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def update_status(
        self,
        complaint_id: int,
        status: ComplaintStatus,
        resolved_by: int
    ) -> Optional[PlatformComplaint]:
        """Update complaint status"""
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            return None

        complaint.status = status
        complaint.resolved_by = resolved_by
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def count_by_status(self) -> Dict[str, int]:
        """Count platform complaints grouped by status"""
        result = await self.db.execute(
            select(PlatformComplaint.status, func.count(PlatformComplaint.id))
            .group_by(PlatformComplaint.status)
        )
        counts = {status.value: 0 for status in ComplaintStatus}
        for status, count in result.all():
            counts[status.value] = count
        return counts

    async def count_by_category(self) -> Dict[str, int]:
        """Count platform complaints grouped by category"""
        result = await self.db.execute(
            select(PlatformComplaint.category, func.count(PlatformComplaint.id))
            .group_by(PlatformComplaint.category)
        )
        counts = {category.value: 0 for category in PlatformComplaintCategory}
        for category, count in result.all():
            counts[category.value] = count
        return counts

    async def respond_to_complaint(
        self,
        complaint_id: int,
        moderator_response: str,
        status: ComplaintStatus,
        resolved_by: int
    ) -> Optional[PlatformComplaint]:
        """Add moderator response to complaint and update status"""
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            return None

        complaint.moderator_response = moderator_response
        complaint.status = status
        complaint.resolved_by = resolved_by
        complaint.response_read = False  # Mark as unread for user
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def mark_response_as_read(self, complaint_id: int) -> Optional[PlatformComplaint]:
        """Mark moderator response as read by user"""
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            return None

        complaint.response_read = True
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def get_unread_responses_for_user(self, user_id: int) -> List[PlatformComplaint]:
        """Get all platform complaints with unread moderator responses for a user"""
        result = await self.db.execute(
            select(PlatformComplaint)
            .where(PlatformComplaint.user_id == user_id)
            .where(PlatformComplaint.moderator_response.isnot(None))
            .where(PlatformComplaint.response_read == False)
            .order_by(PlatformComplaint.updated_at.desc())
        )
        return list(result.scalars().all())
