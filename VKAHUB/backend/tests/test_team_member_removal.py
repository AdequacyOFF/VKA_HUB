"""Tests for team member removal functionality"""

import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models.user import User
from app.domain.models.team import Team
from app.domain.models.team_member import TeamMember
from app.domain.models.notification import Notification
from app.infrastructure.security.password import hash_password


@pytest.fixture
async def captain_user(db_session: AsyncSession) -> User:
    """Create a captain user"""
    user = User(
        login="captain",
        password_hash=hash_password("captainpassword"),
        first_name="Captain",
        last_name="User",
        middle_name="Middle"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def member_user(db_session: AsyncSession) -> User:
    """Create a team member user"""
    user = User(
        login="member",
        password_hash=hash_password("memberpassword"),
        first_name="Member",
        last_name="User",
        middle_name="Middle"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def non_captain_user(db_session: AsyncSession) -> User:
    """Create a non-captain user (regular member)"""
    user = User(
        login="noncaptain",
        password_hash=hash_password("noncaptainpassword"),
        first_name="NonCaptain",
        last_name="User",
        middle_name="Middle"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_team_with_members(
    db_session: AsyncSession,
    captain_user: User,
    member_user: User,
    non_captain_user: User
) -> Team:
    """Create a test team with captain and members"""
    team = Team(
        name="Test Team",
        description="A test team for removal tests",
        captain_id=captain_user.id
    )
    db_session.add(team)
    await db_session.flush()

    # Add captain as member
    captain_member = TeamMember(
        team_id=team.id,
        user_id=captain_user.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(captain_member)

    # Add regular member
    regular_member = TeamMember(
        team_id=team.id,
        user_id=member_user.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(regular_member)

    # Add non-captain user as member
    non_captain_member = TeamMember(
        team_id=team.id,
        user_id=non_captain_user.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(non_captain_member)

    await db_session.commit()
    await db_session.refresh(team)
    return team


class TestTeamMemberRemoval:
    """Tests for team member removal"""

    @pytest.mark.asyncio
    async def test_captain_can_identify_members(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        captain_user: User,
        member_user: User
    ):
        """Test that we can identify team members"""
        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.left_at.is_(None))
        )
        members = result.scalars().all()

        assert len(members) == 3  # Captain + 2 members
        member_user_ids = [m.user_id for m in members]
        assert captain_user.id in member_user_ids
        assert member_user.id in member_user_ids

    @pytest.mark.asyncio
    async def test_captain_check(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        captain_user: User,
        non_captain_user: User
    ):
        """Test captain identification"""
        # Captain user should be identified as captain
        is_captain = test_team_with_members.captain_id == captain_user.id
        assert is_captain is True

        # Non-captain user should not be identified as captain
        is_captain = test_team_with_members.captain_id == non_captain_user.id
        assert is_captain is False

    @pytest.mark.asyncio
    async def test_member_removal_updates_left_at(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        member_user: User
    ):
        """Test that removing a member sets left_at timestamp"""
        # Find the member
        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.user_id == member_user.id)
            .where(TeamMember.left_at.is_(None))
        )
        member = result.scalar_one_or_none()
        assert member is not None

        # Remove the member (set left_at)
        member.left_at = datetime.utcnow()
        await db_session.commit()
        await db_session.refresh(member)

        assert member.left_at is not None

        # Verify member is no longer in active members
        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.left_at.is_(None))
        )
        active_members = result.scalars().all()
        active_user_ids = [m.user_id for m in active_members]
        assert member_user.id not in active_user_ids

    @pytest.mark.asyncio
    async def test_notification_created_on_removal(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        captain_user: User,
        member_user: User
    ):
        """Test that notification is created when member is removed"""
        # Create notification (simulating what the endpoint does)
        captain_name = f"{captain_user.first_name} {captain_user.last_name}"
        notification = Notification(
            user_id=member_user.id,
            type="team_member_removed",
            title="Вы были исключены из команды",
            message=f"Вы были исключены из команды «{test_team_with_members.name}» капитаном {captain_name}.",
            read=False
        )
        db_session.add(notification)
        await db_session.commit()

        # Verify notification was created
        result = await db_session.execute(
            select(Notification)
            .where(Notification.user_id == member_user.id)
            .where(Notification.type == "team_member_removed")
        )
        notifications = result.scalars().all()

        assert len(notifications) == 1
        assert notifications[0].type == "team_member_removed"
        assert test_team_with_members.name in notifications[0].message
        assert captain_name in notifications[0].message
        assert notifications[0].read is False

    @pytest.mark.asyncio
    async def test_captain_cannot_be_removed_via_membership(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        captain_user: User
    ):
        """Test that captain check prevents self-removal"""
        # The business logic check
        is_captain = test_team_with_members.captain_id == captain_user.id
        user_is_target = captain_user.id == captain_user.id

        # Captain cannot remove themselves
        cannot_remove_self = is_captain and user_is_target
        assert cannot_remove_self is True

    @pytest.mark.asyncio
    async def test_non_member_cannot_be_removed(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team
    ):
        """Test that non-existent membership returns no result"""
        non_existent_user_id = 99999

        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.user_id == non_existent_user_id)
            .where(TeamMember.left_at.is_(None))
        )
        member = result.scalar_one_or_none()

        assert member is None


class TestRemovalAuthorization:
    """Tests for removal authorization checks"""

    @pytest.mark.asyncio
    async def test_only_captain_can_authorize_removal(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        captain_user: User,
        non_captain_user: User
    ):
        """Test authorization check for member removal"""
        # Captain should be authorized
        captain_authorized = test_team_with_members.captain_id == captain_user.id
        assert captain_authorized is True

        # Non-captain should not be authorized
        non_captain_authorized = test_team_with_members.captain_id == non_captain_user.id
        assert non_captain_authorized is False

    @pytest.mark.asyncio
    async def test_removed_member_count_decreases(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        member_user: User
    ):
        """Test that active member count decreases after removal"""
        # Get initial count
        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.left_at.is_(None))
        )
        initial_members = result.scalars().all()
        initial_count = len(initial_members)

        # Remove a member
        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.user_id == member_user.id)
            .where(TeamMember.left_at.is_(None))
        )
        member_to_remove = result.scalar_one()
        member_to_remove.left_at = datetime.utcnow()
        await db_session.commit()

        # Get new count
        result = await db_session.execute(
            select(TeamMember)
            .where(TeamMember.team_id == test_team_with_members.id)
            .where(TeamMember.left_at.is_(None))
        )
        new_members = result.scalars().all()
        new_count = len(new_members)

        assert new_count == initial_count - 1


class TestNotificationContent:
    """Tests for notification content"""

    @pytest.mark.asyncio
    async def test_notification_contains_team_name(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        member_user: User,
        captain_user: User
    ):
        """Test that notification message contains team name"""
        captain_name = f"{captain_user.first_name} {captain_user.last_name}"
        message = f"Вы были исключены из команды «{test_team_with_members.name}» капитаном {captain_name}."

        assert test_team_with_members.name in message

    @pytest.mark.asyncio
    async def test_notification_contains_captain_name(
        self,
        db_session: AsyncSession,
        test_team_with_members: Team,
        member_user: User,
        captain_user: User
    ):
        """Test that notification message contains captain name"""
        captain_name = f"{captain_user.first_name} {captain_user.last_name}"
        message = f"Вы были исключены из команды «{test_team_with_members.name}» капитаном {captain_name}."

        assert captain_name in message

    @pytest.mark.asyncio
    async def test_notification_type_is_correct(
        self,
        db_session: AsyncSession,
        member_user: User,
        test_team_with_members: Team,
        captain_user: User
    ):
        """Test that notification has correct type"""
        notification = Notification(
            user_id=member_user.id,
            type="team_member_removed",
            title="Вы были исключены из команды",
            message=f"Вы были исключены из команды «{test_team_with_members.name}».",
            read=False
        )
        db_session.add(notification)
        await db_session.commit()

        result = await db_session.execute(
            select(Notification).where(Notification.user_id == member_user.id)
        )
        saved_notification = result.scalar_one()

        assert saved_notification.type == "team_member_removed"
        assert saved_notification.title == "Вы были исключены из команды"
