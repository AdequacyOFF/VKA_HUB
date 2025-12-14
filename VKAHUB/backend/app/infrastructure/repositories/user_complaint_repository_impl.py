"""UserComplaint repository implementation"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.domain.models.user_complaint import UserComplaint, ComplaintStatus


class UserComplaintRepositoryImpl:
    """SQLAlchemy implementation of UserComplaint repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> UserComplaint:
        """Create a new user complaint"""
        complaint = UserComplaint(**data)
        self.db.add(complaint)
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def get_by_id(self, complaint_id: int) -> Optional[UserComplaint]:
        """Get complaint by ID"""
        result = await self.db.execute(
            select(UserComplaint).where(UserComplaint.id == complaint_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[UserComplaint]:
        """List all complaints with optional filtering"""
        query = select(UserComplaint)

        if status:
            query = query.where(UserComplaint.status == status)

        # Order by created_at descending (newest first), pending first
        query = query.order_by(
            UserComplaint.status.asc(),  # pending comes first alphabetically
            UserComplaint.created_at.desc()
        )

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, status: Optional[str] = None) -> int:
        """Count complaints with optional filtering"""
        query = select(func.count(UserComplaint.id))

        if status:
            query = query.where(UserComplaint.status == status)

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def update_status(
        self,
        complaint_id: int,
        status: ComplaintStatus,
        resolved_by: int
    ) -> Optional[UserComplaint]:
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
        """Count complaints grouped by status"""
        result = await self.db.execute(
            select(UserComplaint.status, func.count(UserComplaint.id))
            .group_by(UserComplaint.status)
        )
        counts = {status.value: 0 for status in ComplaintStatus}
        for status, count in result.all():
            counts[status.value] = count
        return counts
