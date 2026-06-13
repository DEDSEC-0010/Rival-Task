from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_db_url(url: str) -> str:
    """Render (and Heroku) hand out connection strings as ``postgres://...``
    or ``postgresql://...``. SQLAlchemy's async engine needs the explicit
    ``postgresql+asyncpg://`` driver scheme, so normalise here."""
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/tasks")
    jwt_secret: str = Field(default="change-me-in-production-please-32-chars-min")
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24  # 24 hours
    cookie_name: str = "tm_token"
    cookie_secure: bool = False  # set true behind HTTPS in prod
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"

    @field_validator("database_url")
    @classmethod
    def _validate_db_url(cls, v: str) -> str:
        return _normalize_db_url(v)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
