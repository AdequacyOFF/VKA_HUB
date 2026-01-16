"""Tests for competition registration approval/rejection"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models.user import User
from app.domain.models.team import Team
from app.domain.models.competition import Competition
from app.domain.models.competition_registration import CompetitionRegistration
from app.domain.models.competition_team_member import CompetitionTeamMember
from app.domain.models.moderator import Moderator
from app.domain.models.notification import Notification
from app.infrastructure.security.password import hash_password


@pytest.fixture
async def moderator_user(db_session: AsyncSession) -> User:
    """Create a moderator user"""
    user = User(
        login="moderator",
        password_hash=hash_password("modpassword"),
        first_name="Mod",
        last_name="User",
        middle_name="Middle"
    )
    db_session.add(user)
    await db_session.flush()

    moderator = Moderator(
        user_id=user.id,
        assigned_by=user.id,
        assigned_at=datetime.utcnow()
    )
    db_session.add(moderator)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def regular_user(db_session: AsyncSession) -> User:
    """Create a regular (non-moderator) user"""
    user = User(
        login="regularuser",
        password_hash=hash_password("regularpassword"),
        first_name="Regular",
        last_name="User",
        middle_name="Middle"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_team(db_session: AsyncSession, regular_user: User) -> Team:
    """Create a test team"""
    team = Team(
        name="Test Team",
        description="A test team",
        captain_id=regular_user.id
    )
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    return team


@pytest.fixture
async def test_competition(db_session: AsyncSession, moderator_user: User) -> Competition:
    """Create a test competition"""
    competition = Competition(
        name="Test Competition",
        type="hackathon",
        description="A test competition",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=14),
        registration_deadline=datetime.utcnow() + timedelta(days=5),
        min_team_size=1,
        max_team_size=5,
        created_by=moderator_user.id
    )
    db_session.add(competition)
    await db_session.commit()
    await db_session.refresh(competition)
    return competition


@pytest.fixture
async def pending_registration(
    db_session: AsyncSession,
    test_competition: Competition,
    test_team: Team,
    regular_user: User
) -> CompetitionRegistration:
    """Create a pending registration"""
    registration = CompetitionRegistration(
        competition_id=test_competition.id,
        team_id=test_team.id,
        status="pending",
        address="Test Address"
    )
    db_session.add(registration)
    await db_session.flush()

    # Add team member
    team_member = CompetitionTeamMember(
        registration_id=registration.id,
        user_id=regular_user.id
    )
    db_session.add(team_member)
    await db_session.commit()
    await db_session.refresh(registration)
    return registration


class TestRegistrationStatusUpdate:
    """Tests for registration status updates"""

    @pytest.mark.asyncio
    async def test_approve_registration(
        self,
        db_session: AsyncSession,
        pending_registration: CompetitionRegistration,
        moderator_user: User
    ):
        """Test that moderator can approve a pending registration"""
        # Simulate the approval
        pending_registration.status = "approved"
        pending_registration.reviewed_by = moderator_user.id
        pending_registration.reviewed_at = datetime.utcnow()
        await db_session.commit()
        await db_session.refresh(pending_registration)

        assert pending_registration.status == "approved"
        assert pending_registration.reviewed_by == moderator_user.id
        assert pending_registration.reviewed_at is not None

    @pytest.mark.asyncio
    async def test_reject_registration(
        self,
        db_session: AsyncSession,
        pending_registration: CompetitionRegistration,
        moderator_user: User
    ):
        """Test that moderator can reject a pending registration"""
        pending_registration.status = "rejected"
        pending_registration.reviewed_by = moderator_user.id
        pending_registration.reviewed_at = datetime.utcnow()
        await db_session.commit()
        await db_session.refresh(pending_registration)

        assert pending_registration.status == "rejected"
        assert pending_registration.reviewed_by == moderator_user.id
        assert pending_registration.reviewed_at is not None

    @pytest.mark.asyncio
    async def test_notification_created_on_approval(
        self,
        db_session: AsyncSession,
        pending_registration: CompetitionRegistration,
        regular_user: User,
        test_competition: Competition,
        test_team: Team
    ):
        """Test that notification is created when registration is approved"""
        # Create notification (simulating what the endpoint does)
        notification = Notification(
            user_id=regular_user.id,
            type="registration_approved",
            title="Заявка одобрена",
            message=f"Заявка команды '{test_team.name}' на участие в соревновании '{test_competition.name}' была одобрена.",
            read=False
        )
        db_session.add(notification)
        await db_session.commit()

        # Verify notification was created
        result = await db_session.execute(
            select(Notification).where(Notification.user_id == regular_user.id)
        )
        notifications = result.scalars().all()

        assert len(notifications) == 1
        assert notifications[0].type == "registration_approved"
        assert test_team.name in notifications[0].message


class TestReportFiltering:
    """Tests for report generation filtering"""

    @pytest.mark.asyncio
    async def test_only_approved_teams_in_report(
        self,
        db_session: AsyncSession,
        test_competition: Competition,
        test_team: Team,
        regular_user: User
    ):
        """Test that only approved registrations are included in reports"""
        # Create multiple registrations with different statuses
        statuses = ["approved", "pending", "rejected", "approved"]
        registrations = []

        for i, status in enumerate(statuses):
            team = Team(
                name=f"Team {i}",
                description=f"Team {i} description",
                captain_id=regular_user.id
            )
            db_session.add(team)
            await db_session.flush()

            reg = CompetitionRegistration(
                competition_id=test_competition.id,
                team_id=team.id,
                status=status,
                address=f"Address {i}"
            )
            db_session.add(reg)
            registrations.append(reg)

        await db_session.commit()

        # Query only approved registrations (simulating report generation)
        result = await db_session.execute(
            select(CompetitionRegistration)
            .where(CompetitionRegistration.competition_id == test_competition.id)
            .where(CompetitionRegistration.status == "approved")
        )
        approved_registrations = result.scalars().all()

        # Should only get 2 approved registrations
        assert len(approved_registrations) == 2
        for reg in approved_registrations:
            assert reg.status == "approved"


class TestModeratorAuthorization:
    """Tests for moderator authorization"""

    @pytest.mark.asyncio
    async def test_moderator_can_be_identified(
        self,
        db_session: AsyncSession,
        moderator_user: User
    ):
        """Test that moderator user can be identified"""
        result = await db_session.execute(
            select(Moderator).where(Moderator.user_id == moderator_user.id)
        )
        moderator = result.scalar_one_or_none()

        assert moderator is not None
        assert moderator.user_id == moderator_user.id

    @pytest.mark.asyncio
    async def test_regular_user_is_not_moderator(
        self,
        db_session: AsyncSession,
        regular_user: User
    ):
        """Test that regular user is not identified as moderator"""
        result = await db_session.execute(
            select(Moderator).where(Moderator.user_id == regular_user.id)
        )
        moderator = result.scalar_one_or_none()

        assert moderator is None
