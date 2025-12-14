"""Users router"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from app.presentation.api.dependencies import get_db, get_current_user
from app.presentation.api.dtos.user import (
    UserResponse,
    UpdateProfileRequest,
    UpdateRolesSkillsRequest,
    UserListResponse
)
from app.presentation.api.dtos.moderator import CreateUserComplaintRequest, CreatePlatformComplaintRequest
from app.use_cases.user.update_profile import UpdateProfileUseCase
from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.security.password import hash_password
from app.domain.models.user_role import UserRole
from app.domain.models.user_skill import UserSkill
from app.domain.models.role import Role
from app.domain.models.skill import Skill
from app.infrastructure.repositories.moderator_repository_impl import ModeratorRepositoryImpl

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    study_group: Optional[str] = None,
    rank: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all users with filters"""
    user_repo = UserRepositoryImpl(db)

    filters = {}
    if search:
        filters["search"] = search
    if study_group:
        filters["study_group"] = study_group
    if rank:
        filters["rank"] = rank

    users = await user_repo.list_users(skip, limit, filters)
    total = await user_repo.count_users(filters)

    # Build user responses with roles and skills
    user_responses = []
    for user in users:
        # Get user roles
        roles_result = await db.execute(
            select(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user.id)
        )
        roles = [r.name for r in roles_result.scalars().all()]

        # Get user skills
        skills_result = await db.execute(
            select(Skill)
            .join(UserSkill, UserSkill.skill_id == Skill.id)
            .where(UserSkill.user_id == user.id)
        )
        skills = [s.name for s in skills_result.scalars().all()]

        user_responses.append(UserResponse(
            id=user.id,
            login=user.login,
            first_name=user.first_name,
            last_name=user.last_name,
            middle_name=user.middle_name,
            study_group=user.study_group,
            position=user.position,
            rank=user.rank,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at,
            roles=roles,
            skills=skills,
            control_question=user.control_question,
        ))

    return {
        "total": total,
        "items": user_responses,
        "page": skip // limit + 1,
        "page_size": limit
    }


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    try:
        logger.info(f"Updating profile for user {current_user.id}")
        profile_data = request.model_dump(exclude_unset=True)

        if not profile_data:
            logger.warning(f"Empty profile update data for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нет данных для обновления"
            )

        # Handle control answer hashing if provided
        if "control_answer" in profile_data and profile_data["control_answer"]:
            profile_data["control_answer_hash"] = hash_password(profile_data.pop("control_answer"))

        use_case = UpdateProfileUseCase(db)
        result = await use_case.execute(current_user.id, profile_data)

        logger.info(f"Profile updated successfully for user {current_user.id}")
        return UserResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.id}: {str(e)}")
        await db.rollback()
        raise


@router.get("/{user_id}/roles-skills")
async def get_roles_skills(
    user_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's roles and skills"""
    # Only the user themselves can view their roles/skills (for now)
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view own roles and skills"
        )

    # Query user roles with JOIN
    roles_result = await db.execute(
        select(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    roles = roles_result.scalars().all()

    # Query user skills with JOIN
    skills_result = await db.execute(
        select(Skill)
        .join(UserSkill, UserSkill.skill_id == Skill.id)
        .where(UserSkill.user_id == user_id)
    )
    skills = skills_result.scalars().all()

    return {
        "roles": [r.name for r in roles],
        "skills": [s.name for s in skills]
    }


@router.put("/{user_id}/roles-skills")
async def update_roles_skills(
    user_id: int,
    request: UpdateRolesSkillsRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's roles and skills"""
    # Only the user themselves can update their roles/skills
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update own roles and skills"
        )

    try:
        # Delete existing associations
        await db.execute(delete(UserRole).where(UserRole.user_id == user_id))
        await db.execute(delete(UserSkill).where(UserSkill.user_id == user_id))

        # Add new roles
        if request.roles:
            for role_name in request.roles:
                role_result = await db.execute(select(Role).where(Role.name == role_name))
                role = role_result.scalar_one_or_none()
                if role:
                    db.add(UserRole(user_id=user_id, role_id=role.id))
                else:
                    logger.warning(f"Role not found: {role_name}")

        # Add new skills
        if request.skills:
            for skill_name in request.skills:
                skill_result = await db.execute(select(Skill).where(Skill.name == skill_name))
                skill = skill_result.scalar_one_or_none()
                if skill:
                    db.add(UserSkill(user_id=user_id, skill_id=skill.id))
                else:
                    logger.warning(f"Skill not found: {skill_name}")

        await db.commit()

        # Return updated data
        roles_result = await db.execute(
            select(Role).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user_id)
        )
        skills_result = await db.execute(
            select(Skill).join(UserSkill, UserSkill.skill_id == Skill.id).where(UserSkill.user_id == user_id)
        )

        return {
            "roles": [r.name for r in roles_result.scalars()],
            "skills": [s.name for s in skills_result.scalars()]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating roles/skills for user {user_id}: {str(e)}")
        await db.rollback()
        raise


@router.put("/profile/avatar", response_model=UserResponse)
async def update_avatar(
    avatar: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's avatar"""
    from app.infrastructure.storage.file_handler import save_file, delete_file, validate_file_type
    from app.config import get_settings

    settings = get_settings()
    user_repo = UserRepositoryImpl(db)
    user = await user_repo.get_by_id(current_user.id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        # Validate file type
        validate_file_type(avatar, settings.allowed_image_extensions_list)

        # Delete old avatar if exists
        if user.avatar_url:
            delete_file(user.avatar_url)

        # Save new avatar
        avatar_url = await save_file(avatar, "avatars")

        # Update user
        updated_user = await user_repo.update(current_user.id, {"avatar_url": avatar_url})
        await db.commit()

        logger.info(f"Avatar updated for user {current_user.id}: {avatar_url}")

        return UserResponse(
            id=updated_user.id,
            login=updated_user.login,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            middle_name=updated_user.middle_name,
            study_group=updated_user.study_group,
            position=updated_user.position,
            rank=updated_user.rank,
            avatar_url=updated_user.avatar_url,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating avatar for user {current_user.id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )


@router.delete("/profile/avatar", response_model=UserResponse)
async def delete_avatar(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user's avatar"""
    from app.infrastructure.storage.file_handler import delete_file

    user_repo = UserRepositoryImpl(db)
    user = await user_repo.get_by_id(current_user.id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        # Delete avatar file if exists
        if user.avatar_url:
            delete_file(user.avatar_url)

        # Update user to remove avatar_url
        updated_user = await user_repo.update(current_user.id, {"avatar_url": None})
        await db.commit()

        logger.info(f"Avatar deleted for user {current_user.id}")

        return UserResponse(
            id=updated_user.id,
            login=updated_user.login,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            middle_name=updated_user.middle_name,
            study_group=updated_user.study_group,
            position=updated_user.position,
            rank=updated_user.rank,
            avatar_url=None,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )
    except Exception as e:
        logger.error(f"Error deleting avatar for user {current_user.id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete avatar: {str(e)}"
        )


@router.put("/profile/control-question")
async def update_control_question(
    request: UpdateProfileRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's control question and answer"""
    if not request.control_question or not request.control_answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both control_question and control_answer are required"
        )

    profile_data = {
        "control_question": request.control_question,
        "control_answer_hash": hash_password(request.control_answer)
    }

    use_case = UpdateProfileUseCase(db)
    await use_case.execute(current_user.id, profile_data)

    return {"message": "Control question updated successfully"}


@router.get("/teams-history")
async def get_teams_history(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's teams history (past team memberships)"""
    from app.domain.models.team import Team
    from app.domain.models.team_member import TeamMember

    # Query team memberships where user has left (left_at IS NOT NULL)
    result = await db.execute(
        select(TeamMember, Team)
        .join(Team, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == current_user.id)
        .where(TeamMember.left_at.is_not(None))
        .order_by(TeamMember.left_at.desc())
    )

    history = []
    for membership, team in result.all():
        history.append({
            "id": membership.id,
            "team_id": team.id,
            "team_name": team.name,
            "team_image": team.image_url,
            "joined_at": membership.joined_at.isoformat() if membership.joined_at else None,
            "left_at": membership.left_at.isoformat() if membership.left_at else None
        })

    return history


@router.get("/my-team")
async def get_my_team(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all teams user is a member of"""
    from app.infrastructure.repositories.team_repository_impl import TeamRepositoryImpl
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
    from app.domain.models.team_join_request import TeamJoinRequest
    from app.domain.models.user import User

    team_repo = TeamRepositoryImpl(db)
    user_repo = UserRepositoryImpl(db)
    teams = await team_repo.get_user_teams(current_user.id)

    if not teams:
        return []

    # Process each team to include member details
    teams_data = []
    for team in teams:
        # Get team members with user details
        members_data = []
        if team.members:
            for member in team.members:
                if member.left_at is None:  # Only active members
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
                            "joined_at": member.joined_at.isoformat() if member.joined_at else None
                        })

        # Get pending join requests (only if user is captain)
        join_requests_data = []
        if team.captain_id == current_user.id:
            join_requests_result = await db.execute(
                select(TeamJoinRequest, User)
                .join(User, TeamJoinRequest.user_id == User.id)
                .where(TeamJoinRequest.team_id == team.id)
                .where(TeamJoinRequest.status == 'pending')
                .order_by(TeamJoinRequest.created_at.desc())
            )
            for request, user in join_requests_result.all():
                join_requests_data.append({
                    "id": request.id,
                    "user_id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "middle_name": user.middle_name,
                    "avatar": user.avatar_url,
                    "status": request.status.value if hasattr(request.status, 'value') else str(request.status),
                    "created_at": request.created_at.isoformat() if request.created_at else None
                })

        teams_data.append({
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "image": team.image_url,
            "captain_id": team.captain_id,
            "members": members_data,
            "join_requests": join_requests_data
        })

    return teams_data


@router.get("/activity-history")
async def get_activity_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's activity history from logs table"""
    from app.domain.models.log import Log

    # Query activity logs for the current user
    result = await db.execute(
        select(Log)
        .where(Log.user_id == current_user.id)
        .order_by(Log.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    logs = result.scalars().all()

    return [
        {
            "id": log.id,
            "action_type": log.action_type.value if hasattr(log.action_type, 'value') else str(log.action_type),
            "description": log.description,
            "metadata": log.action_metadata,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.get("/competition-participations")
async def get_competition_participations(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's competition participations"""
    from app.domain.models.competition import Competition
    from app.domain.models.competition_registration import CompetitionRegistration
    from app.domain.models.competition_team_member import CompetitionTeamMember
    from app.domain.models.team import Team

    # Query competition participations through CompetitionTeamMember
    result = await db.execute(
        select(Competition, CompetitionRegistration, Team)
        .join(CompetitionRegistration, CompetitionRegistration.competition_id == Competition.id)
        .join(CompetitionTeamMember, CompetitionTeamMember.registration_id == CompetitionRegistration.id)
        .join(Team, CompetitionRegistration.team_id == Team.id)
        .where(CompetitionTeamMember.user_id == current_user.id)
        .order_by(Competition.start_date.desc())
    )

    participations = []
    for competition, registration, team in result.all():
        participations.append({
            "id": registration.id,
            "competition_id": competition.id,
            "competition_name": competition.name,
            "competition_type": competition.type.value if hasattr(competition.type, 'value') else str(competition.type),
            "team_id": team.id,
            "team_name": team.name,
            "status": registration.status,
            "result": registration.result,
            "start_date": competition.start_date.isoformat() if competition.start_date else None,
            "end_date": competition.end_date.isoformat() if competition.end_date else None,
            "applied_at": registration.applied_at.isoformat() if registration.applied_at else None
        })

    return participations


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's profile"""
    user_repo = UserRepositoryImpl(db)
    user = await user_repo.get_by_id(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(
        id=user.id,
        login=user.login,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        study_group=user.study_group,
        position=user.position,
        rank=user.rank,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        is_moderator=await ModeratorRepositoryImpl(db).is_moderator(user.id),
        control_question=user.control_question
    )


@router.post("/complaints")
async def create_complaint(
    request: CreateUserComplaintRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a complaint about another user (authenticated users only)"""
    from app.infrastructure.repositories.user_complaint_repository_impl import UserComplaintRepositoryImpl

    user_repo = UserRepositoryImpl(db)

    # Validate target user exists
    target_user = await user_repo.get_by_id(request.target_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    # Prevent self-complaints
    if current_user.id == request.target_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя подать жалобу на самого себя"
        )

    # Create complaint
    complaint_repo = UserComplaintRepositoryImpl(db)

    try:
        complaint = await complaint_repo.create({
            "reporter_id": current_user.id,
            "target_id": request.target_id,
            "reason": request.reason,
            "description": request.description
        })
        await db.commit()

        return {
            "message": "Жалоба успешно отправлена",
            "complaint_id": complaint.id,
            "status": complaint.status.value
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании жалобы: {str(e)}"
        )


@router.post("/platform-complaints")
async def create_platform_complaint(
    request: CreatePlatformComplaintRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a complaint about the platform/site (authenticated users only)"""
    from app.infrastructure.repositories.platform_complaint_repository_impl import PlatformComplaintRepositoryImpl
    from app.domain.models.platform_complaint import PlatformComplaintCategory

    # Validate category
    try:
        category = PlatformComplaintCategory(request.category)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимая категория. Допустимые значения: {[c.value for c in PlatformComplaintCategory]}"
        )

    # Validate title length
    if len(request.title) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заголовок должен содержать минимум 5 символов"
        )

    if len(request.title) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заголовок не должен превышать 255 символов"
        )

    # Validate description length
    if len(request.description) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Описание должно содержать минимум 20 символов"
        )

    if len(request.description) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Описание не должно превышать 2000 символов"
        )

    # Create platform complaint
    complaint_repo = PlatformComplaintRepositoryImpl(db)

    try:
        complaint = await complaint_repo.create({
            "user_id": current_user.id,
            "category": category,
            "title": request.title,
            "description": request.description
        })
        await db.commit()

        return {
            "message": "Обращение успешно отправлено. Спасибо за ваш отзыв!",
            "complaint_id": complaint.id,
            "status": complaint.status.value
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании обращения: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID with extended details"""
    from app.domain.models.team import Team
    from app.domain.models.team_member import TeamMember
    from app.domain.models.certificate import Certificate
    from app.domain.models.competition import Competition
    from app.domain.models.competition_team_member import CompetitionTeamMember
    from app.domain.models.competition_registration import CompetitionRegistration
    from app.presentation.api.dtos.user import CertificateInfo, TeamInfo, CompetitionInfo
    from sqlalchemy.orm import selectinload

    user_repo = UserRepositoryImpl(db)
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get user roles
    roles_result = await db.execute(
        select(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    roles = [r.name for r in roles_result.scalars().all()]

    # Get user skills
    skills_result = await db.execute(
        select(Skill)
        .join(UserSkill, UserSkill.skill_id == Skill.id)
        .where(UserSkill.user_id == user_id)
    )
    skills = [s.name for s in skills_result.scalars().all()]

    # Get user certificates
    certificates_result = await db.execute(
        select(Certificate).where(Certificate.user_id == user_id)
    )
    certificates = [
        CertificateInfo(
            id=cert.id,
            title=cert.title,
            category=cert.category,
            issued_date=cert.date.isoformat() if cert.date else None
        )
        for cert in certificates_result.scalars().all()
    ]

    # Get user teams (active memberships only)
    teams_result = await db.execute(
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == user_id)
        .where(TeamMember.left_at.is_(None))
    )
    teams = [
        TeamInfo(id=team.id, name=team.name)
        for team in teams_result.scalars().all()
    ]

    # Get user competitions (through team member participations)
    competitions_result = await db.execute(
        select(Competition)
        .join(CompetitionRegistration, CompetitionRegistration.competition_id == Competition.id)
        .join(CompetitionTeamMember, CompetitionTeamMember.registration_id == CompetitionRegistration.id)
        .where(CompetitionTeamMember.user_id == user_id)
        .distinct()
    )
    competitions = [
        CompetitionInfo(id=comp.id, name=comp.name)
        for comp in competitions_result.scalars().all()
    ]

    return UserResponse(
        id=user.id,
        login=user.login,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        study_group=user.study_group,
        position=user.position,
        rank=user.rank,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=roles,
        skills=skills,
        certificates=certificates,
        teams=teams,
        competitions=competitions,
        control_question=user.control_question
    )
