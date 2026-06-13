"""Promote a user to the admin role.

Usage:
    # Either set DATABASE_URL in the environment...
    set DATABASE_URL=postgresql://tasks:...@dpg-....render.com/tasks_qdbv      (cmd)
    $env:DATABASE_URL="postgresql://tasks:...@..."                              (PowerShell)
    export DATABASE_URL=postgresql://tasks:...@...                              (bash)

    # ...then run with the user's email:
    python -m scripts.promote_admin user@example.com

    # Or pass the URL as a second argument:
    python -m scripts.promote_admin user@example.com "postgresql://tasks:..."

The script uses asyncpg (already a backend dependency), so no extra installs
are required when run from the backend virtualenv.
"""
from __future__ import annotations

import asyncio
import os
import sys

import asyncpg


def _normalise(url: str) -> str:
    # asyncpg accepts `postgres://` and `postgresql://`. Strip the SQLAlchemy
    # async driver suffix if the URL was copied from app config.
    if url.startswith("postgresql+asyncpg://"):
        return "postgresql://" + url[len("postgresql+asyncpg://") :]
    return url


async def promote(email: str, url: str) -> None:
    conn = await asyncpg.connect(_normalise(url))
    try:
        result = await conn.execute(
            "UPDATE users SET role = 'admin' WHERE email = $1", email.lower()
        )
        # asyncpg returns strings like "UPDATE 1" / "UPDATE 0"
        if result.endswith(" 0"):
            print(f"No user found with email {email!r}. Did they sign up yet?")
            sys.exit(1)
        print(f"OK: {result}. {email} is now an admin.")
    finally:
        await conn.close()


def main() -> None:
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        sys.exit("usage: python -m scripts.promote_admin <email> [<database-url>]")
    email = sys.argv[1]
    url = sys.argv[2] if len(sys.argv) == 3 else os.environ.get("DATABASE_URL")
    if not url:
        sys.exit(
            "DATABASE_URL is not set. Pass it as the second argument or export it."
        )
    asyncio.run(promote(email, url))


if __name__ == "__main__":
    main()
