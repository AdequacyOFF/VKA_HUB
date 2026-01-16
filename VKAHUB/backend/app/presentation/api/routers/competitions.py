"""Competitions router"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.presentation.api.dependencies import get_db, get_current_user, require_moderator
from app.presentation.api.dtos.competition import (
    CreateCompetitionRequest,
    UpdateCompetitionRequest,
    CompetitionResponse,
    CompetitionStageResponse,
    CompetitionCaseResponse,
    ApplyToCompetitionRequest,
    RegistrationResponse,
    TeamMemberResponse
)
from app.infrastructure.repositories.competition_repository_impl import CompetitionRepositoryImpl
from app.infrastructure.repositories.team_repository_impl import TeamRepositoryImpl
from app.domain.models.competition import Competition
from app.domain.models.competition_report import CompetitionReport, CompetitionResult
from app.domain.models.competition_registration import CompetitionRegistration
from pydantic import BaseModel, Field
from datetime import datetime

router = APIRouter(prefix="/api/competitions", tags=["Competitions"])


def build_competition_response(comp: Competition) -> CompetitionResponse:
    """Helper function to build competition response with stages and cases"""
    stages = [
        CompetitionStageResponse(
            id=stage.id,
            competition_id=stage.competition_id,
            stage_number=stage.stage_number,
            name=stage.name,
            description=stage.description,
            start_date=stage.start_date,
            end_date=stage.end_date,
            created_at=stage.created_at,
            updated_at=stage.updated_at
        ) for stage in comp.stages
    ] if hasattr(comp, 'stages') and comp.stages else []

    cases = [
        CompetitionCaseResponse(
            id=case.id,
            competition_id=case.competition_id,
            case_number=case.case_number,
            title=case.title,
            description=case.description,
            knowledge_stack=case.knowledge_stack,
            created_at=case.created_at,
            updated_at=case.updated_at
        ) for case in comp.cases
    ] if hasattr(comp, 'cases') and comp.cases else []

    return CompetitionResponse(
        id=comp.id,
        type=comp.type,
        name=comp.name,
        link=comp.link,
        image_url=comp.image_url,
        start_date=comp.start_date,
        end_date=comp.end_date,
        registration_deadline=comp.registration_deadline,
        description=comp.description,
        other_type_description=getattr(comp, 'other_type_description', None),
        organizer=getattr(comp, 'organizer', None),
        min_team_size=getattr(comp, 'min_team_size', 2),
        max_team_size=getattr(comp, 'max_team_size', 5),
        case_file_url=comp.case_file_url,
        tasks_file_url=comp.tasks_file_url,
        created_by=comp.created_by,
        created_at=comp.created_at,
        updated_at=comp.updated_at,
        stages=stages,
        cases=cases
    )


@router.get("")
async def list_competitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all competitions"""
    competition_repo = CompetitionRepositoryImpl(db)

    filters = {}
    if search:
        filters["search"] = search
    if type:
        filters["type"] = type

    competitions = await competition_repo.list_competitions(skip, limit, filters)

    return {
        "total": len(competitions),
        "items": [build_competition_response(comp) for comp in competitions]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_competition(
    request: CreateCompetitionRequest,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Create a new competition (moderator only)"""
    competition_repo = CompetitionRepositoryImpl(db)

    # Convert request to dict and prepare stages/cases
    request_data = request.model_dump()
    request_data['stages'] = [stage.model_dump() for stage in request.stages]
    request_data['cases'] = [case.model_dump() for case in request.cases]
    request_data['created_by'] = current_user.id

    competition = await competition_repo.create(request_data)
    await db.commit()
    await db.refresh(competition, ['stages', 'cases'])

    return build_competition_response(competition)


@router.get("/{competition_id}", response_model=CompetitionResponse)
async def get_competition(
    competition_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get competition by ID"""
    competition_repo = CompetitionRepositoryImpl(db)
    competition = await competition_repo.get_by_id(competition_id)

    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )

    return build_competition_response(competition)


@router.put("/{competition_id}")
async def update_competition(
    competition_id: int,
    request: UpdateCompetitionRequest,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Update competition (moderator only)"""
    competition_repo = CompetitionRepositoryImpl(db)

    update_data = request.model_dump(exclude_unset=True)

    # Convert stages and cases to dicts if present
    if 'stages' in update_data and update_data['stages'] is not None:
        update_data['stages'] = [stage.model_dump() for stage in request.stages]
    if 'cases' in update_data and update_data['cases'] is not None:
        update_data['cases'] = [case.model_dump() for case in request.cases]

    competition = await competition_repo.update(competition_id, update_data)

    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )

    await db.commit()
    await db.refresh(competition, ['stages', 'cases'])
    return build_competition_response(competition)


@router.delete("/{competition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competition(
    competition_id: int,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Удалить соревнование (только для модераторов)"""
    competition_repo = CompetitionRepositoryImpl(db)

    competition = await competition_repo.get_by_id(competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Соревнование не найдено"
        )

    success = await competition_repo.delete(competition_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при удалении соревнования"
        )

    await db.commit()
    return None


@router.post("/{competition_id}/apply")
async def apply_to_competition(
    competition_id: int,
    request: ApplyToCompetitionRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply to competition with team (captain only)"""
    competition_repo = CompetitionRepositoryImpl(db)
    team_repo = TeamRepositoryImpl(db)

    # Get competition
    competition = await competition_repo.get_by_id(competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )

    # Get team
    team = await team_repo.get_by_id(request.team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check if user is captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can register the team for competitions"
        )

    # Validate team size
    member_count = len(request.member_ids)
    if member_count < competition.min_team_size or member_count > competition.max_team_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team must have between {competition.min_team_size} and {competition.max_team_size} members. You selected {member_count} members."
        )

    # Validate that all selected members are part of the team
    team_member_ids = {member.user_id for member in team.members}
    for member_id in request.member_ids:
        if member_id not in team_member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User {member_id} is not a member of team {team.name}"
            )

    # Check if team is already registered for this competition
    from sqlalchemy import select, and_
    existing_registration_result = await db.execute(
        select(CompetitionRegistration)
        .where(and_(
            CompetitionRegistration.competition_id == competition_id,
            CompetitionRegistration.team_id == request.team_id
        ))
    )
    existing_registration = existing_registration_result.scalar_one_or_none()
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team '{team.name}' is already registered for this competition"
        )

    # Validate case_id for hackathons
    if competition.type == 'hackathon':
        if not request.case_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Case selection is required for hackathon competitions"
            )
        # Verify case exists and belongs to this competition
        from app.domain.models.competition_case import CompetitionCase
        result = await db.execute(
            select(CompetitionCase)
            .where(CompetitionCase.id == request.case_id)
            .where(CompetitionCase.competition_id == competition_id)
        )
        case = result.scalar_one_or_none()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected case not found or does not belong to this competition"
            )

    # Create registration
    registration = await competition_repo.create_registration({
        "competition_id": competition_id,
        "team_id": request.team_id,
        "member_ids": request.member_ids,
        "case_id": request.case_id,
        "address": request.address,
        "status": "pending"
    })
    await db.commit()

    return {
        "message": "Application submitted successfully",
        "registration_id": registration.id,
        "team_member_count": member_count
    }


# ===== Competition Report DTOs =====
class SubmitCompetitionReportRequest(BaseModel):
    """Request to submit competition report"""
    result: str = Field(..., description="Competition result: 1st_place, 2nd_place, 3rd_place, finalist, semi_finalist, did_not_pass")
    git_link: str = Field(..., description="Link to git repository")
    project_url: Optional[str] = Field(None, description="Link to deployed project (optional)")
    presentation_url: str = Field(..., description="PDF or PowerPoint presentation URL")
    brief_summary: str = Field(..., min_length=50, description="Brief summary of the competition experience")
    placement: Optional[int] = Field(None, ge=1, description="Competition placement (1st, 2nd, 3rd, etc.) - deprecated")
    technologies_used: Optional[str] = None
    individual_contributions: Optional[str] = None
    team_evaluation: Optional[str] = None
    problems_faced: Optional[str] = None
    screenshot_url: Optional[str] = None


class UpdateCompetitionReportRequest(BaseModel):
    """Request to update competition report"""
    result: Optional[str] = Field(None, description="Competition result")
    git_link: Optional[str] = Field(None, description="Link to git repository")
    project_url: Optional[str] = Field(None, description="Link to deployed project")
    presentation_url: Optional[str] = Field(None, description="PDF or PowerPoint presentation URL")
    brief_summary: Optional[str] = Field(None, min_length=50, description="Brief summary")
    technologies_used: Optional[str] = None
    individual_contributions: Optional[str] = None
    team_evaluation: Optional[str] = None
    problems_faced: Optional[str] = None
    screenshot_url: Optional[str] = None


class CompetitionReportResponse(BaseModel):
    """Response for competition report"""
    id: int
    registration_id: int
    team_name: str
    competition_name: str
    result: str
    git_link: str
    project_url: Optional[str]
    presentation_url: str
    brief_summary: str
    placement: Optional[int]
    technologies_used: Optional[str]
    individual_contributions: Optional[str]
    team_evaluation: Optional[str]
    problems_faced: Optional[str]
    screenshot_url: Optional[str]
    submitted_by: int
    submitted_at: datetime


# ===== Competition Report Endpoints =====

@router.post("/reports/upload-presentation")
async def upload_presentation(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload presentation file for competition report (PDF or PowerPoint)"""
    from app.infrastructure.storage.file_handler import save_file, validate_file_type

    # Validate file type - only PDF and PowerPoint files allowed
    allowed_extensions = ['pdf', 'ppt', 'pptx']
    validate_file_type(file, allowed_extensions)

    # Save file
    file_url = await save_file(file, 'presentations')

    return {
        "message": "Presentation uploaded successfully",
        "file_url": file_url
    }


@router.post("/reports/upload-screenshot")
async def upload_screenshot(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload screenshot file for competition report (images only)"""
    from app.infrastructure.storage.file_handler import save_file, validate_file_type

    # Validate file type - only images allowed
    allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    validate_file_type(file, allowed_extensions)

    # Save file
    file_url = await save_file(file, 'screenshots')

    return {
        "message": "Screenshot uploaded successfully",
        "file_url": file_url
    }


@router.post("/{competition_id}/registrations/{registration_id}/report")
async def submit_competition_report(
    competition_id: int,
    registration_id: int,
    request: SubmitCompetitionReportRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit competition report (any team member)"""
    from sqlalchemy import select
    from app.domain.models.competition_team_member import CompetitionTeamMember

    # Get registration
    result = await db.execute(
        select(CompetitionRegistration)
        .where(CompetitionRegistration.id == registration_id)
        .where(CompetitionRegistration.competition_id == competition_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )

    # Get team
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(registration.team_id)

    # Verify user is a team member (captain or regular member)
    is_captain = team.captain_id == current_user.id

    # Check if user is in the competition registration members
    member_result = await db.execute(
        select(CompetitionTeamMember)
        .where(CompetitionTeamMember.registration_id == registration_id)
        .where(CompetitionTeamMember.user_id == current_user.id)
    )
    is_registered_member = member_result.scalar_one_or_none() is not None

    if not is_captain and not is_registered_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team members can submit competition reports"
        )

    # Check if report already exists
    existing_report = await db.execute(
        select(CompetitionReport).where(CompetitionReport.registration_id == registration_id)
    )
    if existing_report.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report already submitted for this registration"
        )

    # Validate result enum
    try:
        result_enum = CompetitionResult(request.result)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid result. Must be one of: {', '.join([r.value for r in CompetitionResult])}"
        )

    # Create report
    report = CompetitionReport(
        registration_id=registration_id,
        result=result_enum,
        git_link=request.git_link,
        project_url=request.project_url,
        presentation_url=request.presentation_url,
        brief_summary=request.brief_summary,
        placement=request.placement,
        technologies_used=request.technologies_used,
        individual_contributions=request.individual_contributions,
        team_evaluation=request.team_evaluation,
        problems_faced=request.problems_faced,
        screenshot_url=request.screenshot_url,
        submitted_by=current_user.id
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    return {
        "message": "Report submitted successfully",
        "report_id": report.id
    }


@router.put("/reports/{report_id}")
async def update_competition_report(
    report_id: int,
    request: UpdateCompetitionReportRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update competition report (any team member)"""
    from sqlalchemy import select

    # Get report
    result = await db.execute(
        select(CompetitionReport).where(CompetitionReport.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Get registration to find team
    reg_result = await db.execute(
        select(CompetitionRegistration).where(CompetitionRegistration.id == report.registration_id)
    )
    registration = reg_result.scalar_one_or_none()

    # Get team
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(registration.team_id)

    # Check permissions: must be team member (captain or regular member)
    is_captain = team.captain_id == current_user.id
    members = await team_repo.get_team_members(registration.team_id)
    is_member = any(m.user_id == current_user.id for m in members)

    if not is_captain and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team members can update the report"
        )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)

    if 'result' in update_data and update_data['result']:
        try:
            update_data['result'] = CompetitionResult(update_data['result'])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid result. Must be one of: {', '.join([r.value for r in CompetitionResult])}"
            )

    for key, value in update_data.items():
        if hasattr(report, key):
            setattr(report, key, value)

    await db.commit()
    await db.refresh(report)

    return {
        "message": "Report updated successfully",
        "report_id": report.id
    }


@router.delete("/reports/{report_id}")
async def delete_competition_report(
    report_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete competition report (any team member)"""
    from sqlalchemy import select

    # Get report
    result = await db.execute(
        select(CompetitionReport).where(CompetitionReport.id == report_id)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    # Get registration to find team
    reg_result = await db.execute(
        select(CompetitionRegistration).where(CompetitionRegistration.id == report.registration_id)
    )
    registration = reg_result.scalar_one_or_none()

    # Get team
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(registration.team_id)

    # Check permissions: must be team member (captain or regular member)
    is_captain = team.captain_id == current_user.id
    members = await team_repo.get_team_members(registration.team_id)
    is_member = any(m.user_id == current_user.id for m in members)

    if not is_captain and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team members can delete reports"
        )

    await db.delete(report)
    await db.commit()

    return {
        "message": "Report deleted successfully"
    }


@router.get("/{competition_id}/reports")
async def get_competition_reports(
    competition_id: int,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Get all reports for a competition (moderator only)"""
    from sqlalchemy import select

    try:
        # Verify competition exists
        competition_repo = CompetitionRepositoryImpl(db)
        competition = await competition_repo.get_by_id(competition_id)
        if not competition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Competition not found"
            )

        # Get all reports for this competition
        result = await db.execute(
            select(CompetitionReport, CompetitionRegistration, Competition)
            .join(CompetitionRegistration, CompetitionReport.registration_id == CompetitionRegistration.id)
            .join(Competition, CompetitionRegistration.competition_id == Competition.id)
            .where(Competition.id == competition_id)
        )

        reports_data = result.all()

        reports = []
        team_repo = TeamRepositoryImpl(db)

        for report, registration, comp in reports_data:
            try:
                team = await team_repo.get_by_id(registration.team_id)
                team_name = team.name if team else "Unknown"
            except Exception as e:
                team_name = "Unknown"

            reports.append(CompetitionReportResponse(
                id=report.id,
                registration_id=report.registration_id,
                team_name=team_name,
                competition_name=comp.name,
                result=report.result.value if report.result else "did_not_pass",
                git_link=report.git_link,
                project_url=report.project_url,
                presentation_url=report.presentation_url,
                brief_summary=report.brief_summary,
                placement=report.placement,
                technologies_used=report.technologies_used,
                individual_contributions=report.individual_contributions,
                team_evaluation=report.team_evaluation,
                problems_faced=report.problems_faced,
                submitted_by=report.submitted_by,
                submitted_at=report.submitted_at
            ))

        return {
            "total": len(reports),
            "competition_name": competition.name,
            "reports": reports
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching competition reports: {str(e)}"
        )


@router.get("/my-reports")
async def get_my_team_reports(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get reports for teams where current user is captain"""
    from sqlalchemy import select

    team_repo = TeamRepositoryImpl(db)
    teams = await team_repo.get_teams_by_captain(current_user.id)

    all_reports = []
    for team in teams:
        # Get registrations for this team
        result = await db.execute(
            select(CompetitionReport, CompetitionRegistration, Competition)
            .join(CompetitionRegistration, CompetitionReport.registration_id == CompetitionRegistration.id)
            .join(Competition, CompetitionRegistration.competition_id == Competition.id)
            .where(CompetitionRegistration.team_id == team.id)
        )

        reports_data = result.all()
        for report, registration, comp in reports_data:
            all_reports.append(CompetitionReportResponse(
                id=report.id,
                registration_id=report.registration_id,
                team_name=team.name,
                competition_name=comp.name,
                result=report.result.value if report.result else "did_not_pass",
                git_link=report.git_link,
                project_url=report.project_url,
                presentation_url=report.presentation_url,
                brief_summary=report.brief_summary,
                placement=report.placement,
                technologies_used=report.technologies_used,
                individual_contributions=report.individual_contributions,
                team_evaluation=report.team_evaluation,
                problems_faced=report.problems_faced,
                submitted_by=report.submitted_by,
                submitted_at=report.submitted_at
            ))

    return {
        "total": len(all_reports),
        "reports": all_reports
    }


@router.get("/my-teams/completed-competitions")
async def get_completed_competitions_for_my_teams(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of all competitions that user's teams participated in (as captain or member)"""
    from sqlalchemy import select
    from app.domain.models.competition_team_member import CompetitionTeamMember
    from app.domain.models.team import Team

    team_repo = TeamRepositoryImpl(db)

    # Get teams where user is captain
    captain_teams_result = await db.execute(
        select(Team).where(Team.captain_id == current_user.id)
    )
    captain_teams = captain_teams_result.scalars().all()

    # Get teams where user is a member (via competition registrations)
    member_registrations_result = await db.execute(
        select(CompetitionTeamMember.registration_id)
        .where(CompetitionTeamMember.user_id == current_user.id)
    )
    member_registration_ids = [r[0] for r in member_registrations_result.all()]

    # Get unique team IDs from registrations where user is a member
    member_team_ids = set()
    if member_registration_ids:
        registrations_result = await db.execute(
            select(CompetitionRegistration.team_id)
            .where(CompetitionRegistration.id.in_(member_registration_ids))
        )
        member_team_ids = {r[0] for r in registrations_result.all()}

    # Combine captain and member teams
    all_team_ids = {team.id for team in captain_teams} | member_team_ids

    all_competitions = []
    seen_registrations = set()  # Avoid duplicates

    for team_id in all_team_ids:
        # Get team info
        team = await team_repo.get_by_id(team_id)
        if not team:
            continue

        # Get all registrations for this team (no date filter)
        result = await db.execute(
            select(CompetitionRegistration, Competition)
            .join(Competition, CompetitionRegistration.competition_id == Competition.id)
            .where(CompetitionRegistration.team_id == team_id)
        )

        registrations_data = result.all()
        for registration, competition in registrations_data:
            if registration.id in seen_registrations:
                continue
            seen_registrations.add(registration.id)

            # Check if report already submitted
            report_check = await db.execute(
                select(CompetitionReport).where(CompetitionReport.registration_id == registration.id)
            )
            has_report = report_check.scalar_one_or_none() is not None

            all_competitions.append({
                "registration_id": registration.id,
                "competition_id": competition.id,
                "competition_name": competition.name,
                "competition_type": competition.type,
                "team_id": team.id,
                "team_name": team.name,
                "end_date": competition.end_date.isoformat(),
                "has_report": has_report
            })

    return {
        "total": len(all_competitions),
        "competitions": all_competitions
    }


@router.get("/{competition_id}/reports/generate")
async def generate_competition_report(
    competition_id: int,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Generate downloadable competition report in DOCX format using template (moderator only)"""
    from sqlalchemy import select
    from fastapi.responses import StreamingResponse
    from app.domain.models.competition_team_member import CompetitionTeamMember
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
    from app.infrastructure.storage.template_report_generator import TemplateReportGenerator
    import os

    try:
        # Verify competition exists
        competition_repo = CompetitionRepositoryImpl(db)
        competition = await competition_repo.get_by_id(competition_id)
        if not competition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Competition not found"
            )

        # Get only approved registrations for this competition
        registrations_result = await db.execute(
            select(CompetitionRegistration)
            .where(CompetitionRegistration.competition_id == competition_id)
            .where(CompetitionRegistration.status == "approved")
            .order_by(CompetitionRegistration.applied_at.asc())
        )
        registrations = registrations_result.scalars().all()

        # Collect participant data
        team_repo = TeamRepositoryImpl(db)
        user_repo = UserRepositoryImpl(db)

        registrations_data = []
        for registration in registrations:
            team = await team_repo.get_by_id(registration.team_id)
            if not team:
                continue

            # Get team members for this registration
            members_result = await db.execute(
                select(CompetitionTeamMember)
                .where(CompetitionTeamMember.registration_id == registration.id)
            )
            members = members_result.scalars().all()

            members_data = []
            for member in members:
                user = await user_repo.get_by_id(member.user_id)
                if user:
                    members_data.append({
                        'rank': user.rank,
                        'last_name': user.last_name,
                        'first_name': user.first_name,
                        'middle_name': user.middle_name,
                        'study_group': user.study_group
                    })

            registrations_data.append({
                'members': members_data,
                'address': registration.address
            })

        # Prepare competition data
        competition_data = {
            'name': competition.name,
            'type': competition.type,
            'organizer': competition.organizer,
            'start_date': competition.start_date,
            'end_date': competition.end_date
        }

        # Use template-based generator
        template_path = '/app/raport_template.docx'
        if not os.path.exists(template_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Report template not found"
            )

        generator = TemplateReportGenerator(template_path)
        buffer = generator.generate(competition_data, registrations_data)

        # Build filename: Рапорт_<Type>_<Name>.docx
        from urllib.parse import quote
        from app.infrastructure.storage.template_report_generator import sanitize_filename

        # Map competition type to Russian
        type_mapping = {
            'hackathon': 'Хакатон',
            'CTF': 'CTF',
            'other': competition.other_type_description if hasattr(competition, 'other_type_description') and competition.other_type_description else 'Другое'
        }
        comp_type = type_mapping.get(competition.type, 'Другое')

        # Sanitize individual components
        safe_type = sanitize_filename(comp_type, max_length=50)
        safe_name = sanitize_filename(competition.name, max_length=80)

        # Build final filename
        filename = f"Рапорт_{safe_type}_{safe_name}.docx"
        encoded_filename = quote(filename)

        # Return as downloadable file with cache-busting headers
        import time
        timestamp = int(time.time())
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "X-Generated-At": str(timestamp)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )

        # Add blank line
        doc.add_paragraph()

        # Add title "Рапорт"
        title = doc.add_paragraph()
        title_run = title.add_run('Рапорт')
        title_run.bold = True
        title_run.font.size = Pt(14)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER

        # Add blank line
        doc.add_paragraph()

        # Build competition description with organizer
        competition_desc = f"«{competition.name}»"
        if competition.organizer:
            competition_desc += f" от {competition.organizer}"

        # Generate date/time schedule based on weekdays and weekends
        # Month translation dict
        months = {
            'january': 'января', 'february': 'февраля', 'march': 'марта',
            'april': 'апреля', 'may': 'мая', 'june': 'июня',
            'july': 'июля', 'august': 'августа', 'september': 'сентября',
            'october': 'октября', 'november': 'ноября', 'december': 'декабря'
        }

        def format_russian_date(date_obj):
            """Format date in Russian"""
            date_str = date_obj.strftime('%d %B').lower()
            for eng, rus in months.items():
                date_str = date_str.replace(eng, rus)
            return date_str

        # Build time schedule string
        start_date = competition.start_date
        end_date = competition.end_date

        # Generate schedule parts for each day range
        schedule_parts = []
        current = start_date
        range_start = None
        range_start_time = None

        while current <= end_date:
            # Determine if weekday (Mon-Fri = 0-4) or weekend (Sat-Sun = 5-6)
            is_weekend = current.weekday() >= 5
            time_start = "09:00" if is_weekend else "16:00"
            time_end = "21:00"

            if range_start is None:
                # Start new range
                range_start = current
                range_start_time = time_start
            elif range_start_time != time_start:
                # Time changed, close previous range and start new one
                if range_start == current - timedelta(days=1):
                    # Single day range
                    prev_date = current - timedelta(days=1)
                    schedule_parts.append(
                        f"с {range_start_time} до {time_end} {format_russian_date(prev_date)}"
                    )
                else:
                    # Multi-day range
                    prev_date = current - timedelta(days=1)
                    schedule_parts.append(
                        f"с {range_start_time} до {time_end} с {format_russian_date(range_start)} до {format_russian_date(prev_date)}"
                    )

                range_start = current
                range_start_time = time_start

            current += timedelta(days=1)

        # Close final range
        if range_start:
            if range_start == end_date:
                # Single day
                schedule_parts.append(
                    f"с {range_start_time} до 21:00 {format_russian_date(end_date)}"
                )
            else:
                # Multi-day
                schedule_parts.append(
                    f"с {range_start_time} до 21:00 с {format_russian_date(range_start)} до {format_russian_date(end_date)} {end_date.year}"
                )

        schedule_text = ", ".join(schedule_parts)

        # Add main text paragraph
        intro_text = (
            f"В соответствии с планом методической деятельности \n"
            f"ВКА имени А.Ф.Можайского на {start_date.year}/{start_date.year + 1} учебный год прошу Вашего ходатайства "
            f"перед вышестоящим командованием об организации участия курсантов 6 факультета "
            f"в онлайн-соревнованиях по продуктовому программированию (быстрая разработка программного обеспечения) "
            f"{competition_desc} {schedule_text} года, "
            f"(в соответствии с графиком проведения соревнований). "
        )
        intro = doc.add_paragraph(intro_text)
        intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        # Add second paragraph
        second_para = doc.add_paragraph(
            'Учебные занятия будут проведены в соответствии с индивидуальным планом. '
            'Список курсантов, планируемых к участию в онлайн-соревнованиях:  '
        )

        # Collect all participants with their team info
        team_repo = TeamRepositoryImpl(db)
        user_repo = UserRepositoryImpl(db)

        participant_counter = 1

        for registration in registrations:
            team = await team_repo.get_by_id(registration.team_id)
            if not team:
                continue

            # Get team members for this registration
            members_result = await db.execute(
                select(CompetitionTeamMember)
                .where(CompetitionTeamMember.registration_id == registration.id)
            )
            members = members_result.scalars().all()

            # Add each member to the list
            for member in members:
                user = await user_repo.get_by_id(member.user_id)
                if user:
                    rank = user.rank if user.rank else 'Рядовой'
                    position = user.position if user.position else ''
                    last_name = user.last_name if user.last_name else ''
                    first_initial = user.first_name[0] + '.' if user.first_name else ''
                    middle_initial = user.middle_name[0] + '.' if user.middle_name else ''

                    member_line = f"{participant_counter}. {rank} {last_name} {first_initial}{middle_initial}"
                    if position:
                        member_line += f" ({position})"
                    member_line += "."

                    doc.add_paragraph(member_line)
                    participant_counter += 1

            # Add location for this team
            location_text = f"Место проведения: {registration.address}." if registration.address else "Место проведения: г. Санкт-Петербург, Лыжный пер., 4к3."
            doc.add_paragraph(location_text)

        # Add blank lines for spacing
        doc.add_paragraph()
        doc.add_paragraph()
        doc.add_paragraph()
        doc.add_paragraph()
        doc.add_paragraph()
        doc.add_paragraph()

        # Add responsible person
        doc.add_paragraph("Ответственный: полковник Дудкин Андрей Сергеевич.")

        doc.add_paragraph()

        # Add first signature block
        doc.add_paragraph("Начальник 61 кафедры ")
        doc.add_paragraph("полковник")
        sig1_name = doc.add_paragraph()
        sig1_name.add_run(" Д.Бирюков")
        doc.add_paragraph(f"«__» ___________ {datetime.now().year} г.")

        doc.add_paragraph()

        # Add addressee for second signature (two lines)
        doc.add_paragraph("Заместителю начальника академии ")
        doc.add_paragraph("по учебной и научной работе")

        doc.add_paragraph()

        # Add endorsement text
        doc.add_paragraph("Ходатайствую по существу рапорта полковника Бирюкова Д.Н.")

        doc.add_paragraph()

        # Add second signature block
        doc.add_paragraph("Начальник 6 факультета ")
        doc.add_paragraph("полковник")
        sig2_name = doc.add_paragraph()
        sig2_name.add_run(" А.Девяткин")
        doc.add_paragraph(f"«__» ___________ {datetime.now().year} г.")

        # Save to buffer
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)

        # URL-encode filename for proper UTF-8 support
        from urllib.parse import quote
        filename = f"raport_{competition.name}_{datetime.now().strftime('%Y%m%d')}.docx"
        encoded_filename = quote(filename)

        # Return as downloadable file with cache-busting headers
        import time
        timestamp = int(time.time())
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "X-Generated-At": str(timestamp)
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )


@router.get("/{competition_id}/registrations")
async def get_competition_registrations(
    competition_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all team registrations for a competition"""
    from sqlalchemy import select
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

    competition_repo = CompetitionRepositoryImpl(db)
    competition = await competition_repo.get_by_id(competition_id)

    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )

    # Get all registrations for this competition
    result = await db.execute(
        select(CompetitionRegistration)
        .where(CompetitionRegistration.competition_id == competition_id)
        .order_by(CompetitionRegistration.applied_at.desc())
    )
    registrations = result.scalars().all()

    # Build response with team details
    team_repo = TeamRepositoryImpl(db)
    user_repo = UserRepositoryImpl(db)
    registrations_data = []

    for registration in registrations:
        team = await team_repo.get_by_id(registration.team_id)
        if not team:
            continue

        # Get team members for this registration
        from app.domain.models.competition_team_member import CompetitionTeamMember
        members_result = await db.execute(
            select(CompetitionTeamMember)
            .where(CompetitionTeamMember.registration_id == registration.id)
        )
        members = members_result.scalars().all()

        # Get user details for each member
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
                    "rank": user.rank,
                    "position": user.position,
                    "avatar": user.avatar_url
                })

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

        # Check if report already submitted
        report_check = await db.execute(
            select(CompetitionReport).where(CompetitionReport.registration_id == registration.id)
        )
        has_report = report_check.scalar_one_or_none() is not None

        registrations_data.append({
            "id": registration.id,
            "team_id": team.id,
            "team_name": team.name,
            "team_description": team.description,
            "team_image": team.image_url,
            "captain": captain,
            "members": members_data,
            "address": registration.address,
            "status": registration.status,
            "applied_at": registration.applied_at.isoformat(),
            "case_id": registration.case_id,
            "has_report": has_report
        })

    return {
        "total": len(registrations_data),
        "registrations": registrations_data
    }


@router.delete("/{competition_id}/registrations/{registration_id}")
async def remove_team_from_competition(
    competition_id: int,
    registration_id: int,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Remove a team from competition (moderator only) and send notifications to all team members"""
    from sqlalchemy import select
    from app.domain.models.notification import Notification
    from app.domain.models.competition_team_member import CompetitionTeamMember
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

    competition_repo = CompetitionRepositoryImpl(db)

    # Verify competition exists
    competition = await competition_repo.get_by_id(competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Competition not found"
        )

    # Get registration
    result = await db.execute(
        select(CompetitionRegistration)
        .where(CompetitionRegistration.id == registration_id)
        .where(CompetitionRegistration.competition_id == competition_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )

    # Get team
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(registration.team_id)
    team_name = team.name if team else "Unknown"

    # Get all team members who were registered
    members_result = await db.execute(
        select(CompetitionTeamMember)
        .where(CompetitionTeamMember.registration_id == registration.id)
    )
    team_members = members_result.scalars().all()

    # Create notifications for all team members
    user_repo = UserRepositoryImpl(db)
    for member in team_members:
        notification = Notification(
            user_id=member.user_id,
            type="team_removed",
            title="Команда удалена из соревнования",
            message=f"Ваша команда '{team_name}' была удалена модератором из соревнования '{competition.name}'. По всем вопросам обращайтесь к модератору.",
            read=False
        )
        db.add(notification)

    # Delete the registration (cascade will delete team members)
    await db.delete(registration)
    await db.commit()

    return {
        "message": "Team removed successfully",
        "notifications_sent": len(team_members)
    }


class UpdateRegistrationStatusRequest(BaseModel):
    """Request body for updating registration status"""
    status: str = Field(..., pattern="^(approved|rejected)$", description="New status: approved or rejected")


@router.patch("/{competition_id}/registrations/{registration_id}/status")
async def update_registration_status(
    competition_id: int,
    registration_id: int,
    request: UpdateRegistrationStatusRequest,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject a team registration (moderator only).
    Sends notifications to all team members.
    """
    from sqlalchemy import select
    from app.domain.models.notification import Notification
    from app.domain.models.competition_team_member import CompetitionTeamMember

    competition_repo = CompetitionRepositoryImpl(db)

    # Verify competition exists
    competition = await competition_repo.get_by_id(competition_id)
    if not competition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Соревнование не найдено"
        )

    # Get registration
    result = await db.execute(
        select(CompetitionRegistration)
        .where(CompetitionRegistration.id == registration_id)
        .where(CompetitionRegistration.competition_id == competition_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )

    # Update status
    old_status = registration.status
    registration.status = request.status
    registration.reviewed_by = current_user.id
    registration.reviewed_at = datetime.utcnow()

    # Get team name for notification
    team_repo = TeamRepositoryImpl(db)
    team = await team_repo.get_by_id(registration.team_id)
    team_name = team.name if team else "Unknown"

    # Get all team members who were registered
    members_result = await db.execute(
        select(CompetitionTeamMember)
        .where(CompetitionTeamMember.registration_id == registration.id)
    )
    team_members = members_result.scalars().all()

    # Create notifications for all team members
    status_text_ru = "одобрена" if request.status == "approved" else "отклонена"
    status_text_en = "approved" if request.status == "approved" else "rejected"
    notification_type = f"registration_{request.status}"

    for member in team_members:
        notification = Notification(
            user_id=member.user_id,
            type=notification_type,
            title=f"Заявка {status_text_ru}",
            message=f"Заявка команды '{team_name}' на участие в соревновании '{competition.name}' была {status_text_ru}.",
            read=False
        )
        db.add(notification)

    await db.commit()

    return {
        "message": f"Registration status updated to {request.status}",
        "registration_id": registration_id,
        "old_status": old_status,
        "new_status": request.status,
        "notifications_sent": len(team_members)
    }
