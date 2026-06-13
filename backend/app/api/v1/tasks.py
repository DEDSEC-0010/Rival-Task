from math import ceil
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.errors import AppError
from app.db.session import get_session
from app.models.activity import TaskAction, TaskActivity
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.activity import ActivityOut
from app.schemas.task import Page, TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _serialise(value: Any) -> Any:
    """Convert a value into something JSON-serialisable for the activity log."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    # Enums (TaskStatus / TaskPriority) and datetimes both render fine as strings.
    return str(value)


def _diff(before: Task, after: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Return a {field: {from, to}} diff for the fields touched by an update."""
    out: dict[str, dict[str, Any]] = {}
    for key, new_value in after.items():
        old_value = getattr(before, key, None)
        if old_value != new_value:
            out[key] = {"from": _serialise(old_value), "to": _serialise(new_value)}
    return out

SortField = Literal["due_date", "priority", "created_at"]
SortOrder = Literal["asc", "desc"]

# Priority ordering for sort: high > medium > low
_PRIORITY_ORDER = {
    TaskPriority.high: 3,
    TaskPriority.medium: 2,
    TaskPriority.low: 1,
}


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TaskOut:
    task = Task(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    session.add(task)
    await session.flush()
    session.add(
        TaskActivity(
            task_id=task.id,
            user_id=user.id,
            action=TaskAction.created,
            details={"title": task.title, "priority": _serialise(task.priority)},
        )
    )
    await session.commit()
    await session.refresh(task)
    return TaskOut.model_validate(task)


@router.get("", response_model=Page[TaskOut])
async def list_tasks(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_: Annotated[TaskStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query(max_length=200)] = None,
    sort: Annotated[SortField, Query()] = "created_at",
    order: Annotated[SortOrder, Query()] = "desc",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[TaskOut]:
    stmt = select(Task).where(Task.user_id == user.id)
    count_stmt = select(func.count()).select_from(Task).where(Task.user_id == user.id)

    if status_:
        stmt = stmt.where(Task.status == status_)
        count_stmt = count_stmt.where(Task.status == status_)

    if search:
        like = f"%{search}%"
        stmt = stmt.where(Task.title.ilike(like))
        count_stmt = count_stmt.where(Task.title.ilike(like))

    if sort == "priority":
        # Use a CASE expression so that high > medium > low
        from sqlalchemy import case
        priority_rank = case(
            (Task.priority == TaskPriority.high, 3),
            (Task.priority == TaskPriority.medium, 2),
            (Task.priority == TaskPriority.low, 1),
        )
        stmt = stmt.order_by(priority_rank.desc() if order == "desc" else priority_rank.asc(), Task.created_at.desc())
    elif sort == "due_date":
        # Push NULL due_dates to the end regardless of direction
        col = Task.due_date
        stmt = stmt.order_by(
            col.is_(None),
            col.desc() if order == "desc" else col.asc(),
            Task.created_at.desc(),
        )
    else:  # created_at
        col = Task.created_at
        stmt = stmt.order_by(col.desc() if order == "desc" else col.asc())

    total = (await session.execute(count_stmt)).scalar_one()
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    items = (await session.execute(stmt)).scalars().all()

    return Page[TaskOut](
        items=[TaskOut.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total else 0,
    )


async def _get_owned_task(task_id: UUID, user: User, session: AsyncSession) -> Task:
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task or task.user_id != user.id:
        # 404 (not 403) so users can't probe for IDs they don't own
        raise AppError(404, "NOT_FOUND", "Task not found")
    return task


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TaskOut:
    task = await _get_owned_task(task_id, user, session)
    return TaskOut.model_validate(task)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TaskOut:
    task = await _get_owned_task(task_id, user, session)
    updates = payload.model_dump(exclude_unset=True)
    diff = _diff(task, updates)
    if not diff:
        # No-op update; do not write an activity row for it.
        return TaskOut.model_validate(task)

    # Status transitions get their own action so the timeline reads naturally.
    if "status" in diff:
        new_status = updates["status"]
        if new_status == TaskStatus.completed:
            action = TaskAction.completed
        elif task.status == TaskStatus.completed:
            action = TaskAction.reopened
        else:
            action = TaskAction.updated
    else:
        action = TaskAction.updated

    for key, value in updates.items():
        setattr(task, key, value)

    session.add(
        TaskActivity(task_id=task.id, user_id=user.id, action=action, details={"changed": diff})
    )
    await session.commit()
    await session.refresh(task)
    return TaskOut.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    task = await _get_owned_task(task_id, user, session)
    await session.delete(task)
    await session.commit()


@router.get("/{task_id}/activity", response_model=list[ActivityOut])
async def list_task_activity(
    task_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[ActivityOut]:
    # Reuse the ownership check so users cannot read other people's history.
    await _get_owned_task(task_id, user, session)
    result = await session.execute(
        select(TaskActivity)
        .where(TaskActivity.task_id == task_id)
        .order_by(TaskActivity.created_at.desc())
    )
    rows = result.scalars().all()
    return [ActivityOut.model_validate(r) for r in rows]
