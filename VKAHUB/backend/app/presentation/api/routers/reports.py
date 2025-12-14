"""Reports router"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.presentation.api.dependencies import get_db, get_current_user
from app.presentation.api.dtos.report import (
    CreateCaptainReportRequest,
    CaptainReportResponse
)
from app.infrastructure.repositories.report_repository_impl import ReportRepositoryImpl

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/captain", status_code=status.HTTP_201_CREATED)
async def create_captain_report(
    request: CreateCaptainReportRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a captain report"""
    report_repo = ReportRepositoryImpl(db)

    report = await report_repo.create_captain_report({
        **request.model_dump(),
        "submitted_by": current_user.id
    })
    await db.commit()

    return CaptainReportResponse(
        id=report.id,
        registration_id=report.registration_id,
        summary=report.summary,
        technologies_used=report.technologies_used,
        individual_contributions=report.individual_contributions,
        team_evaluation=report.team_evaluation,
        problems_faced=report.problems_faced,
        attachments=report.attachments,
        submitted_by=report.submitted_by,
        submitted_at=report.submitted_at
    )


@router.get("/captain")
async def list_captain_reports(
    db: AsyncSession = Depends(get_db)
):
    """List all captain reports"""
    report_repo = ReportRepositoryImpl(db)
    reports = await report_repo.list_captain_reports()

    return {
        "items": [
            CaptainReportResponse(
                id=report.id,
                registration_id=report.registration_id,
                summary=report.summary,
                technologies_used=report.technologies_used,
                individual_contributions=report.individual_contributions,
                team_evaluation=report.team_evaluation,
                problems_faced=report.problems_faced,
                attachments=report.attachments,
                submitted_by=report.submitted_by,
                submitted_at=report.submitted_at
            ) for report in reports
        ]
    }
