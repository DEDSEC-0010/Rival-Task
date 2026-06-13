from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import decode_token
from app.db.session import get_session
from app.models.user import User, UserRole


async def get_current_user(
    session: Annotated[AsyncSession, Depends(get_session)],
    authorization: Annotated[str | None, Header()] = None,
    tm_token: Annotated[str | None, Cookie()] = None,
) -> User:
    settings = get_settings()
    token: str | None = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif tm_token:
        token = tm_token
    else:
        # also check cookie by configured name if different
        token = tm_token

    if not token:
        raise AppError(401, "UNAUTHORIZED", "Authentication required")

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise AppError(401, "UNAUTHORIZED", "Invalid or expired token")

    try:
        user_id = UUID(payload["sub"])
    except (ValueError, TypeError):
        raise AppError(401, "UNAUTHORIZED", "Invalid token subject")

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppError(401, "UNAUTHORIZED", "User no longer exists")
    return user


async def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.admin:
        raise AppError(403, "FORBIDDEN", "Admin access required")
    return user
