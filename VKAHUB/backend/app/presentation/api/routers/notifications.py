"""Notifications router"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.presentation.api.dependencies import get_db, get_current_user
from app.domain.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    """Notification response schema"""
    id: int
    type: str
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationsListResponse(BaseModel):
    """Response for notifications list"""
    total: int
    unread_count: int
    notifications: List[NotificationResponse]


@router.get("", response_model=NotificationsListResponse)
async def get_my_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's notifications.
    Used for polling-based notification system.
    """
    # Build query
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        query = query.where(Notification.read == False)

    query = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    notifications = result.scalars().all()

    # Get total unread count
    unread_result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.read == False)
    )
    unread_count = len(unread_result.scalars().all())

    return NotificationsListResponse(
        total=len(notifications),
        unread_count=unread_count,
        notifications=[
            NotificationResponse(
                id=n.id,
                type=n.type,
                title=n.title,
                message=n.message,
                read=n.read,
                created_at=n.created_at
            ) for n in notifications
        ]
    )


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read"""
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.read = True
    await db.commit()

    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.read == False)
    )
    notifications = result.scalars().all()

    for notification in notifications:
        notification.read = True

    await db.commit()

    return {"message": f"Marked {len(notifications)} notifications as read"}
