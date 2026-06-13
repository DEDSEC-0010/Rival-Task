# Tasks — full-stack task management

Built for the Rival full-stack developer assessment. Python (FastAPI) backend + Next.js 14 (App Router) frontend, PostgreSQL data.

## Stack

| Layer    | Choice                                                  |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind, Geist    |
| State    | TanStack Query + React Hook Form + Zod                  |
| Backend  | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), asyncpg   |
| Database | PostgreSQL 16 (SQLite is used in tests only)            |
| Auth     | JWT in httpOnly cookie + bcrypt password hashing        |

## Quick start (Docker — one command)

If you have Docker installed:

```bash
cp .env.example .env       # optional, defaults are fine
docker compose up --build
```

Wait ~60 seconds for the first build. Then:
- Frontend at http://localhost:3000
- Backend at http://localhost:8000 (`/docs` for OpenAPI)
- Postgres at localhost:5432 (user: `tasks`, pass: `tasks`, db: `tasks`)

`docker compose down` stops everything. `docker compose down -v` also drops the database volume for a clean slate.

The compose setup is independent of the Render deploy — both work, neither blocks the other.

## Quick start (local, without Docker)

You will need: Python 3.12, Node 20+, and a PostgreSQL 14+ instance.

### 1. Copy environment variables

```bash
cp .env.example .env
```

Edit `DATABASE_URL` if your Postgres is not on the default `localhost:5432`.

### 2. Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate          # Windows
# source .venv/bin/activate       # macOS / Linux
pip install -r requirements-dev.txt

# Create the database and apply migrations
createdb tasks                     # or: psql -c "CREATE DATABASE tasks"
alembic upgrade head

# Run the API
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. OpenAPI docs at `/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. The frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

### 4. Tests

```bash
cd backend
pytest                             # runs against in-memory SQLite, no Postgres needed
```

Six tests cover: auth flow, duplicate-email rejection, route protection, cross-user ownership, full CRUD round trip, and combined filter + search + sort + pagination.

## API

All routes are prefixed with `/api/v1`. Task routes require auth (cookie or `Authorization: Bearer <token>`).

| Method | Path                  | Body / query                                                                                       | Notes               |
| ------ | --------------------- | -------------------------------------------------------------------------------------------------- | ------------------- |
| POST   | `/auth/signup`        | `{email, password}`                                                                                | sets httpOnly cookie |
| POST   | `/auth/login`         | `{email, password}`                                                                                | sets cookie          |
| POST   | `/auth/logout`        |                                                                                                    | clears cookie        |
| GET    | `/auth/me`            |                                                                                                    | current user         |
| POST   | `/tasks`              | `{title, description?, status?, priority?, due_date?}`                                             |                     |
| GET    | `/tasks`              | `?status=&search=&sort=created_at\|due_date\|priority&order=asc\|desc&page=&page_size=`            | owner-scoped         |
| GET    | `/tasks/:id`          |                                                                                                    | 404 if not yours     |
| PATCH  | `/tasks/:id`          | partial body                                                                                       | 404 if not yours     |
| DELETE | `/tasks/:id`          |                                                                                                    | 204                  |
| GET    | `/admin/tasks`        | `?status=&page=&page_size=`                                                                        | admin role only      |

Error responses share a single shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

## Granting admin

There is no UI for promoting users. Use SQL after signup:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Features delivered

**Required**

- Tasks: create, list, get one, partial update, delete
- Status filter, title search (case-insensitive `ILIKE`), sort by due date / priority / created date, pagination
- Filters + search + sort compose on the same request
- Auth: signup, login, logout, `/me`, JWT in httpOnly cookie (persists across page refresh)
- Bcrypt password hashing
- All task routes are protected; rows are owner-scoped
- Input validation via Pydantic; consistent error envelope; correct status codes
- Loading skeletons, empty state, error state with retry
- Responsive layout (mobile-first)
- 6 backend tests covering meaningful behavior

**Bonus**

- Role-based access: `admin` role with `/admin/tasks` endpoint and a dedicated admin view
- Optimistic UI for toggle-complete and delete, with rollback on failure
- Dark mode toggle (system / light / dark) persisted via `next-themes`
- GitHub Actions CI: runs pytest on the backend and lint + build on the frontend
- Dockerized setup: `docker compose up --build` brings up Postgres + backend + frontend with migrations applied

**Out of scope (by agreement)**

- Real-time updates (WebSockets / SSE)
- File attachments
- Activity log
- Live deployment: deployed to Render (see Deployment section below)

## Project layout

```
backend/
  app/
    api/v1/           # routers: auth, tasks, admin
    core/             # config, security, deps, error handling
    db/               # SQLAlchemy session
    models/           # User, Task
    schemas/          # Pydantic request/response models
    main.py
  alembic/            # migrations
  tests/              # pytest suite
frontend/
  app/                # Next.js App Router pages
  components/         # UI primitives and feature components
  lib/                # api client, types, query hooks
docs/superpowers/specs/   # design spec for this project
.github/workflows/ci.yml
.env.example
```

## Trade-offs and assumptions

- **Auth in httpOnly cookie + body token.** The cookie provides automatic session persistence and resists XSS; the body token lets a curl / Postman caller try the API without cookie state.
- **404 (not 403) on accessing another user's task.** Returning 403 leaks the existence of an ID; 404 says "nothing here for you."
- **SQLite for tests, Postgres for prod.** Models use SQLAlchemy 2.0's cross-dialect `Uuid` type so tests run anywhere with no Postgres install. Migrations target Postgres exclusively.
- **Sort by priority** uses a `CASE` rank (`high > medium > low`), not the alphabetical order of the enum string.
- **Sort by due_date** pushes `NULL`s to the end regardless of direction — "no date" should not crowd the top.
- **No admin-promotion UI.** Admin status is set with one SQL update. Keeps the auth surface minimal.
- **Confirm-on-delete uses `window.confirm`.** A modal dialog would be nicer, but `confirm` is honest about what it does and keeps the surface tight.

## Deployment — Render

A `render.yaml` Blueprint at the repo root provisions everything (Postgres + backend + frontend) on Render. Free plan works for evaluation.

### One-time setup

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint** → connect your GitHub repo → pick the branch.
3. Render reads `render.yaml` and creates three resources:
   - `tasks-db` (managed Postgres, free plan)
   - `tasks-backend` (FastAPI web service, runs `alembic upgrade head` on every start)
   - `tasks-frontend` (Next.js web service)
4. Two env vars are marked `sync: false` because they reference URLs that don't exist until the services are created. After the first deploy, fill them in:

   | Service          | Env var               | Value                                 |
   | ---------------- | --------------------- | ------------------------------------- |
   | `tasks-backend`  | `CORS_ORIGINS`        | `https://tasks-frontend.onrender.com` |
   | `tasks-frontend` | `NEXT_PUBLIC_API_URL` | `https://tasks-backend.onrender.com`  |

   (Use whatever hostnames Render assigned — visible on each service's page.)

5. Saving each env var triggers an automatic rebuild. Once both rebuilds finish, the app is live at the frontend URL.

### Why `NEXT_PUBLIC_API_URL` needs a rebuild, not a restart

Next.js inlines `NEXT_PUBLIC_*` env vars into the JS bundle at **build time**. Setting it later in the dashboard automatically triggers a rebuild — that's the rebuild step in #5 above. If you ever change the backend URL, you must trigger a manual redeploy of the frontend.

### Cookie / CORS for cross-origin

The backend and frontend are on different subdomains of `onrender.com`, so:

- Backend ships cookies with `SameSite=None; Secure` (`COOKIE_SAMESITE=none` + `COOKIE_SECURE=true` in `render.yaml`).
- Backend CORS allows credentials and is locked to the frontend's exact origin (no wildcards).
- Frontend fetch calls use `credentials: "include"`.

All three are required for the auth cookie to round-trip across origins.

### Granting admin in production

Easiest: Render dashboard → `tasks-db` → **Connect** → **PSQL** tab → paste:

```sql
UPDATE users SET role='admin' WHERE email='you@example.com';
```

No local install needed; runs in Render's browser terminal.

If you prefer running locally without installing `psql`, the repo ships a tiny script that uses asyncpg (already a backend dependency):

```powershell
cd backend
.\.venv\Scripts\python.exe -m scripts.promote_admin you@example.com "postgresql://tasks:...@..."
```

(Pass the External Database URL from the Render dashboard as the second arg, or set it as `DATABASE_URL` and run with one arg.)

### Free-tier caveats

- Render's free Postgres expires after 90 days — back up or upgrade before then.
- Free web services spin down after 15 minutes of inactivity. The first request after sleep takes 30-50 seconds while the container cold-starts. Both services sleep independently.
- **Cold-start CORS errors are not real CORS bugs.** While the backend container is booting, Render's edge returns a 502 with no CORS headers; the browser surfaces that as a "CORS policy" error. The frontend mitigates this by pinging `/health` on mount (warming the backend before the user clicks anything) and retrying transient query failures with exponential backoff. The error can still appear on the very first visit after a long sleep; reload once and it goes away.

## Deployment — alternative platforms

If you'd rather not use Render, the building blocks are portable:

- Database: Neon, Supabase, or any managed Postgres
- Backend: Railway / Fly.io / Heroku — same env vars apply
- Frontend: Vercel works (same `NEXT_PUBLIC_API_URL` rebuild caveat)

For any cross-origin deployment, the cookie/CORS settings above (`COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, exact `CORS_ORIGINS`) are required.
