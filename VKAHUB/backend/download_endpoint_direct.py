#!/usr/bin/env python3
"""
Direct download from endpoint INSIDE the container to get exact bytes.
This uses the actual endpoint code path without auth bypass.
"""
import asyncio
import hashlib
import sys
import os

# Add app to path
sys.path.insert(0, '/app')

async def main():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.infrastructure.storage.template_report_generator import TemplateReportGenerator
    from sqlalchemy import select
    from app.domain.models.competition import Competition
    from app.domain.models.competition_registration import CompetitionRegistration
    from app.infrastructure.repositories.team_repository_impl import TeamRepositoryImpl
    from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
    from app.domain.models.competition_team_member import CompetitionTeamMember

    # Use same DB connection as the app
    DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@postgres:5432/vkahub')
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    competition_id = 4
    
    async with async_session() as db:
        # Get competition
        result = await db.execute(select(Competition).where(Competition.id == competition_id))
        competition = result.scalar_one_or_none()
        
        if not competition:
            print(f"Competition {competition_id} not found!")
            return
        
        print(f"Competition: {competition.name}")
        
        # Get registrations (exact same code as endpoint)
        registrations_result = await db.execute(
            select(CompetitionRegistration)
            .where(CompetitionRegistration.competition_id == competition_id)
            .order_by(CompetitionRegistration.applied_at.asc())
        )
        registrations = registrations_result.scalars().all()
        print(f"Registrations: {len(registrations)}")
        
        # Collect data (exact same code as endpoint)
        team_repo = TeamRepositoryImpl(db)
        user_repo = UserRepositoryImpl(db)
        
        registrations_data = []
        for registration in registrations:
            team = await team_repo.get_by_id(registration.team_id)
            if not team:
                continue
            
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
                        'position': user.position
                    })
            
            registrations_data.append({
                'members': members_data,
                'address': registration.address
            })
        
        print(f"Teams with members: {len(registrations_data)}")
        
        # Prepare competition data
        competition_data = {
            'name': competition.name,
            'type': competition.type,
            'organizer': competition.organizer,
            'start_date': competition.start_date,
            'end_date': competition.end_date
        }
        
        # Generate using exact same code path as endpoint
        template_path = '/app/raport_template.docx'
        generator = TemplateReportGenerator(template_path)
        buffer = generator.generate(competition_data, registrations_data)
        
        # Get bytes
        buffer.seek(0)
        docx_bytes = buffer.read()
        
        # Save to file
        output_path = '/app/from_endpoint_exact.docx'
        with open(output_path, 'wb') as f:
            f.write(docx_bytes)
        
        # Calculate SHA-256
        sha256 = hashlib.sha256(docx_bytes).hexdigest()
        
        print(f"\nSaved to: {output_path}")
        print(f"Size: {len(docx_bytes)} bytes")
        print(f"SHA-256: {sha256}")
        
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(main())
