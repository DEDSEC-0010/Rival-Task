from math import ceil
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.db.session import get_session
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import Page, TaskOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/tasks", response_model=Page[TaskOut])
async def list_all_tasks(
    _: Annotated[User, Depends(require_admin)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_: Annotated[TaskStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[TaskOut]:
    stmt = select(Task)
    count_stmt = select(func.count()).select_from(Task)
    if status_:
        stmt = stmt.where(Task.status == status_)
        count_stmt = count_stmt.where(Task.status == status_)

    total = (await session.execute(count_stmt)).scalar_one()
    stmt = stmt.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    items = (await session.execute(stmt)).scalars().all()

    return Page[TaskOut](
        items=[TaskOut.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total else 0,
    )
