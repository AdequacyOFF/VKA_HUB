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
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

    team_repo = TeamRepositoryImpl(db)
    user_repo = UserRepositoryImpl(db)

    filters = {}
    if search:
        filters["search"] = search

    teams = await team_repo.list_teams(skip, limit, filters)

    # Build team responses with captain info and members
    team_items = []
    for team in teams:
        # Get captain details
        captain = None
        if team.captain_id:
            captain_user = await user_repo.get_by_id(team.captain_id)
            if captain_user:
                captain = {
                    "id": captain_user.id,
                    "first_name": captain_user.first_name,
                    "last_name": captain_user.last_name,
                    "login": captain_user.login
                }

        # Get team members with user details
        members = await team_repo.get_team_members(team.id)
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

        team_data = {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "image_url": team.image_url,
            "direction": team.direction,
            "captain_id": team.captain_id,
            "captain": captain,
            "members": members_data,
            "created_at": team.created_at,
            "updated_at": team.updated_at
        }
        team_items.append(team_data)

    return {
        "total": len(team_items),
        "items": team_items
    }


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
        image_url=request.image_url,
        direction=request.direction
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
        direction=team.direction,
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
        direction=updated_team.direction,
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


@router.post("/{team_id}/invite/{user_id}")
async def invite_user_to_team(
    team_id: int,
    user_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Invite a user to join the team (captain only)"""
    from app.domain.models.team_join_request import TeamJoinRequest, JoinRequestStatus
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
    from sqlalchemy import select, and_

    team_repo = TeamRepositoryImpl(db)
    user_repo = UserRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if current user is captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can invite users"
        )

    # Check if target user exists
    target_user = await user_repo.get_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user is already a member
    members = await team_repo.get_team_members(team_id)
    if any(member.user_id == user_id for member in members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team"
        )

    # Check if there's already a pending invitation or request
    result = await db.execute(
        select(TeamJoinRequest).where(
            and_(
                TeamJoinRequest.team_id == team_id,
                TeamJoinRequest.user_id == user_id,
                TeamJoinRequest.status == JoinRequestStatus.PENDING
            )
        )
    )
    existing_request = result.scalar_one_or_none()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="There is already a pending request or invitation for this user"
        )

    # Create new invitation
    invitation = TeamJoinRequest(
        team_id=team_id,
        user_id=user_id,
        invited_by=current_user.id,  # This marks it as an invitation
        status=JoinRequestStatus.PENDING
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    return {
        "message": "User invited successfully",
        "invitation_id": invitation.id,
        "status": invitation.status.value
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
    """Get competition reports for a team (any team member can view)"""
    from app.domain.models.competition_report import CompetitionReport
    from app.domain.models.competition_registration import CompetitionRegistration
    from app.domain.models.competition import Competition
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is team member (captain or regular member)
    is_captain = team.captain_id == current_user.id
    members = await team_repo.get_team_members(team_id)
    is_member = any(m.user_id == current_user.id for m in members)

    if not is_captain and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team members can view reports"
        )

    # Get all competition registrations for this team
    registrations_result = await db.execute(
        select(CompetitionRegistration)
        .where(CompetitionRegistration.team_id == team_id)
    )
    registrations = registrations_result.scalars().all()
    registration_ids = [r.id for r in registrations]

    if not registration_ids:
        return []

    # Get all competition reports for these registrations
    reports_result = await db.execute(
        select(CompetitionReport)
        .where(CompetitionReport.registration_id.in_(registration_ids))
        .order_by(CompetitionReport.submitted_at.desc())
    )
    reports = reports_result.scalars().all()

    # Build result with competition info
    result = []
    for report in reports:
        # Find registration and competition
        registration = next((r for r in registrations if r.id == report.registration_id), None)
        if not registration:
            continue

        # Get competition info
        competition_result = await db.execute(
            select(Competition).where(Competition.id == registration.competition_id)
        )
        competition = competition_result.scalar_one_or_none()

        result.append({
            "id": report.id,
            "registration_id": report.registration_id,
            "team_id": team_id,
            "team_name": team.name,
            "competition_id": registration.competition_id,
            "competition_name": competition.name if competition else "Unknown",
            "result": report.result.value if report.result else None,
            "git_link": report.git_link,
            "project_url": report.project_url,
            "presentation_url": report.presentation_url,
            "brief_summary": report.brief_summary,
            "placement": report.placement,
            "technologies_used": report.technologies_used,
            "individual_contributions": report.individual_contributions,
            "team_evaluation": report.team_evaluation,
            "problems_faced": report.problems_faced,
            "screenshot_url": report.screenshot_url,
            "submitted_by": report.submitted_by,
            "submitted_at": report.submitted_at.isoformat() if report.submitted_at else None,
        })

    return result


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
            # Determine if this is an invitation (invited_by is not null) or a request
            is_invitation = req.invited_by is not None
            inviter = None
            if is_invitation:
                inviter = await user_repo.get_by_id(req.invited_by)

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
                "is_invitation": is_invitation,
                "invited_by": {
                    "id": inviter.id,
                    "login": inviter.login,
                    "first_name": inviter.first_name,
                    "last_name": inviter.last_name
                } if inviter else None,
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


@router.get("/{team_id}/statistics")
async def get_team_statistics(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get team statistics (competitions participated, prizes won)"""
    from app.domain.models.competition_registration import CompetitionRegistration
    from app.domain.models.competition_report import CompetitionReport
    from sqlalchemy import select, and_

    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Get all competition registrations for this team
    result = await db.execute(
        select(CompetitionRegistration)
        .where(CompetitionRegistration.team_id == team_id)
    )
    registrations = result.scalars().all()

    total_competitions = len(registrations)

    # Get prizes won (placements 1-3)
    prizes_won = 0
    for registration in registrations:
        # Get report for this registration
        report_result = await db.execute(
            select(CompetitionReport)
            .where(CompetitionReport.registration_id == registration.id)
        )
        report = report_result.scalar_one_or_none()

        if report and report.placement and 1 <= report.placement <= 3:
            prizes_won += 1

    return {
        "team_id": team_id,
        "competitions_participated": total_competitions,
        "prizes_won": prizes_won
    }
