"""Certificates router"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from app.presentation.api.dependencies import get_db, get_current_user
from app.presentation.api.dtos.certificate import (
    CreateCertificateRequest,
    UpdateCertificateRequest,
    CertificateResponse
)
from app.infrastructure.repositories.certificate_repository_impl import CertificateRepositoryImpl
from app.infrastructure.storage.file_handler import save_file, validate_file_type

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


@router.get("")
async def list_certificates(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's certificates"""
    cert_repo = CertificateRepositoryImpl(db)
    certificates = await cert_repo.list_by_user(current_user.id)

    return {
        "items": [
            CertificateResponse.model_validate(cert) for cert in certificates
        ]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_certificate(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    issued_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new certificate with file upload"""
    try:
        logger.info(f"Creating certificate for user {current_user.id}: {title}")

        # Validate file type
        validate_file_type(file, ['pdf', 'png', 'jpg', 'jpeg'])

        # Save file
        file_url = await save_file(file, "certificates")
        logger.info(f"File saved: {file_url}")

        # Parse date if provided
        cert_date = None
        if issued_date:
            try:
                from datetime import datetime
                cert_date = datetime.strptime(issued_date, "%Y-%m-%d").date()
            except ValueError:
                logger.warning(f"Invalid date format: {issued_date}")

        cert_repo = CertificateRepositoryImpl(db)
        certificate = await cert_repo.create({
            "title": title,
            "description": description,
            "category": category,
            "date": cert_date,
            "file_url": file_url,
            "user_id": current_user.id
        })
        await db.commit()
        await db.refresh(certificate)

        logger.info(f"Certificate created successfully: ID {certificate.id}")
        return CertificateResponse.model_validate(certificate)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating certificate: {str(e)}")
        await db.rollback()
        raise


@router.put("/{certificate_id}")
async def update_certificate(
    certificate_id: int,
    request: UpdateCertificateRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update certificate"""
    try:
        logger.info(f"Updating certificate {certificate_id} for user {current_user.id}")
        cert_repo = CertificateRepositoryImpl(db)
        certificate = await cert_repo.get_by_id(certificate_id)

        if not certificate:
            logger.warning(f"Certificate {certificate_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Сертификат не найден"
            )

        if certificate.user_id != current_user.id:
            logger.warning(f"User {current_user.id} attempted to update certificate {certificate_id} owned by user {certificate.user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы можете обновлять только свои сертификаты"
            )

        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            logger.warning(f"Empty update data for certificate {certificate_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нет данных для обновления"
            )

        updated_cert = await cert_repo.update(certificate_id, update_data)
        await db.commit()
        await db.refresh(updated_cert)

        logger.info(f"Certificate {certificate_id} updated successfully")
        return CertificateResponse.model_validate(updated_cert)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating certificate {certificate_id}: {str(e)}")
        await db.rollback()
        raise


@router.delete("/{certificate_id}")
async def delete_certificate(
    certificate_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete certificate"""
    cert_repo = CertificateRepositoryImpl(db)
    certificate = await cert_repo.get_by_id(certificate_id)

    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )

    if certificate.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete own certificates"
        )

    await cert_repo.delete(certificate_id)
    await db.commit()

    return {"message": "Certificate deleted successfully"}
