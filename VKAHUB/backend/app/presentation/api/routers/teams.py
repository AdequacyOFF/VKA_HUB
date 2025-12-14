"""Teams router"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.presentation.api.dependencies import get_db, get_current_user
from app.presentation.api.dtos.team import (
    CreateTeamRequest,
    UpdateTeamRequest,
    TeamResponse,
    JoinTeamRequest,
    JoinRequestResponse,
    TeamListResponse,
    CreateReportRequest,
    ReportResponse
)
from app.use_cases.teams.create_team import CreateTeamUseCase
from app.infrastructure.repositories.team_repository_impl import TeamRepositoryImpl
from app.domain.models.team_report import TeamReport 
from app.domain.models.user import User
from app.infrastructure.repositories.team_report_repository_impl import TeamReportRepositoryImpl


router = APIRouter(prefix="/api/teams", tags=["Teams"])


@router.get("", response_model=TeamListResponse)
async def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all teams"""
    team_repo = TeamRepositoryImpl(db)

    filters = {}
    if search:
        filters["search"] = search

    teams = await team_repo.list_teams(skip, limit, filters)

    return TeamListResponse(
        total=len(teams),
        items=[
            TeamResponse(
                id=team.id,
                name=team.name,
                description=team.description,
                image_url=team.image_url,
                captain_id=team.captain_id,
                created_at=team.created_at,
                updated_at=team.updated_at
            ) for team in teams
        ]
    )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TeamResponse)
async def create_team(
    request: CreateTeamRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new team"""
    use_case = CreateTeamUseCase(db)
    result = await use_case.execute(
        name=request.name,
        description=request.description or "",
        captain_id=current_user.id,
        image_url=request.image_url
    )
    return TeamResponse(**result)


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get team by ID"""
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

    team_repo = TeamRepositoryImpl(db)
    user_repo = UserRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Get team members with user details
    members = await team_repo.get_team_members(team_id)
    members_data = []

    for member in members:
        user = await user_repo.get_by_id(member.user_id)
        if user:
            members_data.append({
                "id": member.id,
                "user_id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "middle_name": user.middle_name,
                "avatar": user.avatar_url,
                "position": user.position,
                "joined_at": member.joined_at,
                "left_at": member.left_at
            })

    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        image_url=team.image_url,
        captain_id=team.captain_id,
        members=members_data,
        created_at=team.created_at,
        updated_at=team.updated_at
    )


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    request: UpdateTeamRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update team (captain or moderator only)"""
    from app.domain.models.moderator import Moderator
    from sqlalchemy import select

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is captain or moderator
    is_captain = team.captain_id == current_user.id

    # Check if user is moderator
    result = await db.execute(
        select(Moderator).where(Moderator.user_id == current_user.id)
    )
    is_moderator = result.scalar_one_or_none() is not None

    if not is_captain and not is_moderator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain or moderator can update team"
        )

    update_data = request.model_dump(exclude_unset=True)
    updated_team = await team_repo.update(team_id, update_data)
    await db.commit()

    return TeamResponse(
        id=updated_team.id,
        name=updated_team.name,
        description=updated_team.description,
        image_url=updated_team.image_url,
        captain_id=updated_team.captain_id,
        created_at=updated_team.created_at,
        updated_at=updated_team.updated_at
    )


@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete team (moderator only)"""
    # This requires moderator check - implementation simplified
    team_repo = TeamRepositoryImpl(db)
    success = await team_repo.delete(team_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    await db.commit()
    return {"message": "Team deleted successfully"}


@router.post("/{team_id}/join")
async def request_join_team(
    team_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request to join a team"""
    from app.domain.models.team_join_request import TeamJoinRequest, JoinRequestStatus
    from sqlalchemy import select, and_

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is already a member
    members = await team_repo.get_team_members(team_id)
    if any(member.user_id == current_user.id for member in members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this team"
        )

    # Check if user already has a pending request
    result = await db.execute(
        select(TeamJoinRequest).where(
            and_(
                TeamJoinRequest.team_id == team_id,
                TeamJoinRequest.user_id == current_user.id,
                TeamJoinRequest.status == JoinRequestStatus.PENDING
            )
        )
    )
    existing_request = result.scalar_one_or_none()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending join request for this team"
        )

    # Create new join request
    join_request = TeamJoinRequest(
        team_id=team_id,
        user_id=current_user.id,
        status=JoinRequestStatus.PENDING
    )
    db.add(join_request)
    await db.commit()
    await db.refresh(join_request)

    return {
        "message": "Join request sent successfully",
        "request_id": join_request.id,
        "status": join_request.status.value
    }


@router.get("/{team_id}/members")
async def get_team_members(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get team members with user details"""
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

    team_repo = TeamRepositoryImpl(db)
    user_repo = UserRepositoryImpl(db)
    members = await team_repo.get_team_members(team_id)

    # Build member data with user details
    members_data = []
    for member in members:
        user = await user_repo.get_by_id(member.user_id)
        if user:
            members_data.append({
                "id": member.id,
                "user_id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "middle_name": user.middle_name,
                "avatar": user.avatar_url,
                "position": user.position,
                "joined_at": member.joined_at.isoformat() if member.joined_at else None,
                "left_at": member.left_at.isoformat() if member.left_at else None
            })

    return {"members": members_data}


@router.post("/{team_id}/leave")
async def leave_team(
    team_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Leave a team"""
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is a member of this team
    members = await team_repo.get_team_members(team_id)
    user_membership = next(
        (m for m in members if m.user_id == current_user.id),
        None
    )

    if not user_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this team"
        )

    # Captain cannot leave - must transfer captain role first
    if team.captain_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captain cannot leave the team. Transfer captain role first or delete the team."
        )

    # Remove user from team (sets left_at = now)
    success = await team_repo.remove_member(team_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave team"
        )

    await db.commit()
    return {"message": "Successfully left the team"}


@router.post("/{team_id}/request-captain-change")
async def request_captain_change(
    team_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Request captain change for a team"""
    # Implementation would create a moderator request for captain change
    return {"message": "Captain change request sent to moderators"}


@router.get("/{team_id}/reports")
async def get_team_reports(
    team_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get team reports (captain only)"""
    from app.domain.models.competition_report import CompetitionReport

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is captain (moderator check can be added)
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can view reports"
        )

    # Get reports for this team
    from sqlalchemy import select
    result = await db.execute(
        select(CompetitionReport)
        .where(CompetitionReport.team_id == team_id)
        .order_by(CompetitionReport.created_at.desc())
    )
    reports = result.scalars().all()

    return [
        {
            "id": r.id,
            "competition_id": r.competition_id,
            "team_id": r.team_id,
            "file_url": r.file_url,
            "status": r.status,
            "submitted_by": r.submitted_by,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reports
    ]


@router.get("/{team_id}/join-requests")
async def get_join_requests(
    team_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending join requests (captain only)"""
    from app.domain.models.team_join_request import TeamJoinRequest

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can view join requests"
        )

    # Get pending requests
    from sqlalchemy import select
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

    result = await db.execute(
        select(TeamJoinRequest)
        .where(
            TeamJoinRequest.team_id == team_id,
            TeamJoinRequest.status == "pending"
        )
        .order_by(TeamJoinRequest.created_at.desc())
    )
    requests = result.scalars().all()

    # Get user details for each request
    user_repo = UserRepositoryImpl(db)
    request_list = []

    for req in requests:
        user = await user_repo.get_by_id(req.user_id)
        if user:
            request_list.append({
                "id": req.id,
                "team_id": team_id,
                "user_id": user.id,
                "user_name": user.login,
                "user_avatar": user.avatar_url,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "middle_name": user.middle_name,
                "study_group": user.position,
                "status": req.status,
                "created_at": req.created_at.isoformat() if req.created_at else None
            })

    return request_list


@router.post("/{team_id}/join-requests/{request_id}/approve")
async def approve_join_request(
    team_id: int,
    request_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve a join request (captain only)"""
    from app.domain.models.team_join_request import TeamJoinRequest, JoinRequestStatus
    from sqlalchemy import select

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can approve join requests"
        )

    # Get the join request
    result = await db.execute(
        select(TeamJoinRequest).where(TeamJoinRequest.id == request_id)
    )
    join_request = result.scalar_one_or_none()

    if not join_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Join request not found"
        )

    if join_request.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Join request does not belong to this team"
        )

    if join_request.status != JoinRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Join request has already been processed"
        )

    # Approve the request
    join_request.status = JoinRequestStatus.APPROVED

    # Add user as team member
    await team_repo.add_member(team_id, join_request.user_id)

    await db.commit()

    return {"message": "Join request approved successfully"}


@router.post("/{team_id}/join-requests/{request_id}/reject")
async def reject_join_request(
    team_id: int,
    request_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a join request (captain only)"""
    from app.domain.models.team_join_request import TeamJoinRequest, JoinRequestStatus
    from sqlalchemy import select

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can reject join requests"
        )

    # Get the join request
    result = await db.execute(
        select(TeamJoinRequest).where(TeamJoinRequest.id == request_id)
    )
    join_request = result.scalar_one_or_none()

    if not join_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Join request not found"
        )

    if join_request.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Join request does not belong to this team"
        )

    if join_request.status != JoinRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Join request has already been processed"
        )

    # Reject the request
    join_request.status = JoinRequestStatus.REJECTED
    await db.commit()

    return {"message": "Join request rejected successfully"}

from fastapi import File, UploadFile
from app.infrastructure.storage.file_handler import save_file  # ← это уже есть в проекте!

@router.post("/{team_id}/upload-image")
async def upload_team_image(
    team_id: int,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Загрузка изображения команды — только капитан"""
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)
    
    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")
    
    if team.captain_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только капитан может загружать изображение")

    # Сохраняем файл
    file_path = await save_file(file, category="team_image")
    image_url = f"/static/{file_path.split('static/')[1]}"

    # Обновляем команду
    await team_repo.update(team_id, {"image_url": image_url})
    await db.commit()

    return {"image_url": image_url}

@router.delete("/{team_id}/image")
async def remove_team_image(
    team_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Удаление изображения команды — только капитан"""
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(status_code=404, detail="Команда не найдена")

    if team.captain_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только капитан может удалять изображение")

    await team_repo.update(team_id, {"image_url": None})
    await db.commit()

    return {"message": "Изображение удалено"}

# В teams.py:
from app.domain.repositories.team_report_repository import TeamReportRepository
from app.infrastructure.repositories.team_report_repository_impl import TeamReportRepositoryImpl

@router.post("/{team_id}/reports", response_model=ReportResponse)
async def create_team_report(
    team_id: int,
    request: CreateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if team.captain_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only captain can create reports")
    
    # Используем НОВЫЙ репозиторий
    team_report_repo = TeamReportRepositoryImpl(db)
    
    report = TeamReport(
        team_id=team_id,
        author_id=current_user.id,
        title=request.title,
        content=request.content
    )
    
    created_report = await team_report_repo.create(report)
    await db.commit()

    return ReportResponse(
        id=created_report.id,
        team_id=created_report.team_id,
        author_id=created_report.author_id,
        title=created_report.title,
        content=created_report.content,
        created_at=created_report.created_at,
        updated_at=created_report.updated_at
    )


@router.put("/{team_id}/reports/{report_id}", response_model=ReportResponse)
async def update_team_report(
    team_id: int,
    report_id: int,
    request: CreateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a team report (captain only)"""
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.captain_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only captain can update reports")

    team_report_repo = TeamReportRepositoryImpl(db)
    report = await team_report_repo.get_by_id(report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.team_id != team_id:
        raise HTTPException(status_code=400, detail="Report does not belong to this team")

    # Update the report
    updated_report = await team_report_repo.update(report_id, {
        "title": request.title,
        "content": request.content
    })
    await db.commit()

    return ReportResponse(
        id=updated_report.id,
        team_id=updated_report.team_id,
        author_id=updated_report.author_id,
        title=updated_report.title,
        content=updated_report.content,
        created_at=updated_report.created_at,
        updated_at=updated_report.updated_at
    )


@router.delete("/{team_id}/reports/{report_id}")
async def delete_team_report(
    team_id: int,
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a team report (captain only)"""
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.captain_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only captain can delete reports")

    team_report_repo = TeamReportRepositoryImpl(db)
    report = await team_report_repo.get_by_id(report_id)

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.team_id != team_id:
        raise HTTPException(status_code=400, detail="Report does not belong to this team")

    await team_report_repo.delete(report_id)
    await db.commit()

    return {"message": "Report deleted successfully"}
    