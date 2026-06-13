import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Index, Uuid, func
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import sqltypes

from app.db.base import Base


class TaskAction(str, enum.Enum):
    created = "created"
    updated = "updated"
    completed = "completed"
    reopened = "reopened"


class TaskActivity(Base):
    __tablename__ = "task_activity"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[TaskAction] = mapped_column(SAEnum(TaskAction, name="task_action"), nullable=False)
    details: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        sqltypes.DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (Index("ix_task_activity_task_created", "task_id", "created_at"),)
