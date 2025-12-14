"""Initialize default system user"""

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user import User
from app.domain.models.moderator import Moderator
from app.infrastructure.security.password import hash_password
from app.infrastructure.db import async_session_factory

logger = logging.getLogger(__name__)

# Default system user configuration
DEFAULT_USER_LOGIN = "GeDeKo"
DEFAULT_USER_PASSWORD = "Jorik2005"
DEFAULT_USER_FIRST_NAME = "System"
DEFAULT_USER_LAST_NAME = "Administrator"


async def init_default_user() -> None:
    """
    Initialize default system user with moderator privileges.

    This function runs on application startup and ensures that a default
    system user exists in the database. The user cannot be deleted and
    will be recreated if missing.

    Default credentials:
        Login: GeDeKo
        Password: Jorik2005
        Role: Moderator
    """
    try:
        logger.info("🔄 Checking for default system user...")

        async with async_session_factory() as session:
            # Check if default user already exists
            result = await session.execute(
                select(User).where(User.login == DEFAULT_USER_LOGIN)
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                logger.info(f"✅ Default system user '{DEFAULT_USER_LOGIN}' already exists (ID: {existing_user.id})")

                # Ensure moderator entry exists for this user
                moderator_result = await session.execute(
                    select(Moderator).where(Moderator.user_id == existing_user.id)
                )
                existing_moderator = moderator_result.scalar_one_or_none()

                if not existing_moderator:
                    logger.info(f"🔄 Creating moderator entry for user '{DEFAULT_USER_LOGIN}'...")
                    moderator = Moderator(
                        user_id=existing_user.id,
                        assigned_by=None  # System assigned
                    )
                    session.add(moderator)
                    await session.commit()
                    logger.info(f"✅ Moderator entry created for user '{DEFAULT_USER_LOGIN}'")
                else:
                    logger.info(f"✅ User '{DEFAULT_USER_LOGIN}' already has moderator privileges")

                return

            # Create default user
            logger.info(f"🔄 Creating default system user '{DEFAULT_USER_LOGIN}'...")

            # Hash the password
            password_hash = hash_password(DEFAULT_USER_PASSWORD)

            # Create user instance
            default_user = User(
                login=DEFAULT_USER_LOGIN,
                password_hash=password_hash,
                first_name=DEFAULT_USER_FIRST_NAME,
                last_name=DEFAULT_USER_LAST_NAME,
                middle_name=None,
                control_question=None,
                control_answer_hash=None,
                study_group=None,
                position="System Administrator",
                rank=None,
                avatar_url=None
            )

            session.add(default_user)
            await session.flush()  # Flush to get the user ID

            # Create moderator entry
            moderator = Moderator(
                user_id=default_user.id,
                assigned_by=None  # System assigned
            )
            session.add(moderator)

            # Commit transaction
            await session.commit()

            logger.info(f"✅ Default system user '{DEFAULT_USER_LOGIN}' created successfully (ID: {default_user.id})")
            logger.info(f"✅ User '{DEFAULT_USER_LOGIN}' assigned moderator privileges")
            logger.info(f"📝 Credentials - Login: {DEFAULT_USER_LOGIN}, Password: {DEFAULT_USER_PASSWORD}")

    except Exception as e:
        logger.error(f"❌ Failed to initialize default system user: {str(e)}")
        logger.exception(e)
        # Don't raise - allow application to start even if this fails
        # The user can be created manually or on next restart
