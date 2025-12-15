"""Competitions router"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
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
from app.domain.models.competition_report import CompetitionReport
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

    # Create registration
    registration = await competition_repo.create_registration({
        "competition_id": competition_id,
        "team_id": request.team_id,
        "member_ids": request.member_ids,
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
    git_link: str = Field(..., description="Link to git repository")
    presentation_url: str = Field(..., description="PDF or PowerPoint presentation URL")
    brief_summary: str = Field(..., min_length=50, description="Brief summary of the competition experience")
    placement: Optional[int] = Field(None, ge=1, description="Competition placement (1st, 2nd, 3rd, etc.)")
    technologies_used: Optional[str] = None
    individual_contributions: Optional[str] = None
    team_evaluation: Optional[str] = None
    problems_faced: Optional[str] = None


class CompetitionReportResponse(BaseModel):
    """Response for competition report"""
    id: int
    registration_id: int
    team_name: str
    competition_name: str
    git_link: str
    presentation_url: str
    brief_summary: str
    placement: Optional[int]
    technologies_used: Optional[str]
    individual_contributions: Optional[str]
    team_evaluation: Optional[str]
    problems_faced: Optional[str]
    submitted_by: int
    submitted_at: datetime


# ===== Competition Report Endpoints =====

@router.post("/{competition_id}/registrations/{registration_id}/report")
async def submit_competition_report(
    competition_id: int,
    registration_id: int,
    request: SubmitCompetitionReportRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit competition report (team captain only)"""
    from sqlalchemy import select

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

    # Verify captain
    if team.captain_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team captain can submit competition reports"
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

    # Create report
    report = CompetitionReport(
        registration_id=registration_id,
        git_link=request.git_link,
        presentation_url=request.presentation_url,
        brief_summary=request.brief_summary,
        placement=request.placement,
        technologies_used=request.technologies_used,
        individual_contributions=request.individual_contributions,
        team_evaluation=request.team_evaluation,
        problems_faced=request.problems_faced,
        submitted_by=current_user.id
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    return {
        "message": "Report submitted successfully",
        "report_id": report.id
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
                git_link=report.git_link,
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
                git_link=report.git_link,
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


@router.get("/{competition_id}/reports/generate")
async def generate_competition_report(
    competition_id: int,
    current_user = Depends(require_moderator),
    db: AsyncSession = Depends(get_db)
):
    """Generate downloadable competition report (moderator only)"""
    from sqlalchemy import select
    from fastapi.responses import StreamingResponse
    import io

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
            select(CompetitionReport, CompetitionRegistration)
            .join(CompetitionRegistration, CompetitionReport.registration_id == CompetitionRegistration.id)
            .where(CompetitionRegistration.competition_id == competition_id)
        )

        reports_data = result.all()

        # Create a simple text report (in production, use python-docx for Word documents)
        report_content = f"""
ОТЧЕТ ПО СОРЕВНОВАНИЮ
{'=' * 80}

Название: {competition.name}
Тип: {competition.type}
Дата проведения: {competition.start_date.strftime('%d.%m.%Y')} - {competition.end_date.strftime('%d.%m.%Y')}

{'=' * 80}
ОТЧЕТЫ КОМАНД
{'=' * 80}

"""

        team_repo = TeamRepositoryImpl(db)

        for idx, (report, registration) in enumerate(reports_data, 1):
            team = await team_repo.get_by_id(registration.team_id)
            team_name = team.name if team else "Unknown"

            report_content += f"""
{idx}. КОМАНДА: {team_name}
{'-' * 80}
Место: {report.placement if report.placement else 'Не указано'}
Дата подачи: {report.submitted_at.strftime('%d.%m.%Y %H:%M')}

Git репозиторий: {report.git_link}
Презентация: {report.presentation_url}

Краткое резюме:
{report.brief_summary}

"""
            if report.technologies_used:
                report_content += f"Использованные технологии:\n{report.technologies_used}\n\n"

            if report.problems_faced:
                report_content += f"Проблемы и сложности:\n{report.problems_faced}\n\n"

            report_content += "\n"

        # Convert to bytes
        buffer = io.BytesIO()
        buffer.write(report_content.encode('utf-8'))
        buffer.seek(0)

        # Return as downloadable file
        return StreamingResponse(
            buffer,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=competition_report_{competition_id}_{datetime.now().strftime('%Y%m%d')}.txt"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )
