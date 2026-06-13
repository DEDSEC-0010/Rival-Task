from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.models.activity import TaskAction


class ActivityOut(BaseModel):
    id: UUID
    task_id: UUID
    user_id: UUID
    action: TaskAction
    details: dict[str, Any] | None
    created_at: datetime

    model_config = {"from_attributes": True}
