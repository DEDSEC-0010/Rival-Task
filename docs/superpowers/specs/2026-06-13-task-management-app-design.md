# Task Management Application — Design

## Goal
Full-stack task management app for the Rival full-stack developer assessment.

## Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Alembic, Pydantic v2, python-jose (JWT), passlib[bcrypt], pytest
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod, next-themes
- **Database:** PostgreSQL 16
- **CI:** GitHub Actions

## Repo Layout
```
/backend
  /app
    /api/v1     # routers: auth, tasks
    /core       # config, security, deps
    /db         # session, base
    /models     # SQLAlchemy models
    /schemas    # Pydantic schemas
    main.py
  /tests
  /alembic
  requirements.txt
  pytest.ini
/frontend
  /app          # Next.js App Router pages
  /components
  /lib          # api client, auth, query client
  /hooks
  package.json
.env.example
.github/workflows/ci.yml
README.md
```

## Data Model
**users**
- id (UUID, PK)
- email (text, unique, indexed)
- password_hash (text)
- role (enum: `user`, `admin`, default `user`)
- created_at (timestamptz)

**tasks**
- id (UUID, PK)
- user_id (UUID, FK → users.id, indexed)
- title (text, NOT NULL, max 200)
- description (text)
- status (enum: `pending`, `in_progress`, `completed`, default `pending`)
- priority (enum: `low`, `medium`, `high`, default `medium`)
- due_date (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
- Indexes: `(user_id, status)`, `(user_id, due_date)`, `(user_id, priority)`, GIN trgm on `title`

## API
```
POST   /api/v1/auth/signup        {email, password}     -> {user, token}
POST   /api/v1/auth/login         {email, password}     -> {user, token}
POST   /api/v1/auth/logout                              -> 204
GET    /api/v1/auth/me                                  -> {user}

POST   /api/v1/tasks              {title, description, status, priority, due_date}
GET    /api/v1/tasks              ?status=&search=&sort=&order=&page=&page_size=
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id          partial update
DELETE /api/v1/tasks/:id

GET    /api/v1/admin/tasks        (admin only) — all users' tasks
```

### Filtering / Sorting / Pagination
- `status` filter (optional, exact match)
- `search` (substring on title, case-insensitive)
- `sort` ∈ {`due_date`, `priority`, `created_at`}, default `created_at`
- `order` ∈ {`asc`, `desc`}, default `desc`
- `page` (default 1), `page_size` (default 20, max 100)
- Response shape: `{ items: [...], total, page, page_size, total_pages }`

### Error response shape
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

## Auth Flow
- Signup/login returns JWT in **httpOnly cookie** (24h expiry) AND in response body for clients that want it
- Frontend uses cookie automatically; refresh restores session because cookie persists
- All `/api/v1/tasks/*` routes require valid JWT
- Ownership enforced: `WHERE user_id = current_user.id` on every query (except admin routes)
- Admin role bypasses ownership check on `/admin/tasks`
- Passwords hashed with bcrypt (cost 12)

## Frontend Pages
- `/login` — login form
- `/signup` — signup form
- `/` — task list (filters, search, sort, pagination, dark mode toggle)
- `/tasks/new` — create task
- `/tasks/[id]/edit` — edit task
- `/admin` — admin view of all users' tasks (admin only)

## Frontend Behavior
- Authentication state lives in TanStack Query `useUser()` hook backed by `GET /auth/me`
- Optimistic mutations for `complete` and `delete` with rollback on failure
- Loading skeletons, empty state ("No tasks yet"), error toasts
- Responsive: mobile-first Tailwind layout, hamburger nav under `md`
- Dark mode via `next-themes`, persisted in localStorage

## Testing (≥3 meaningful tests)
1. **Auth flow:** signup → login → /me returns user; wrong password → 401
2. **Task CRUD + ownership:** user A creates task; user B cannot GET/PATCH/DELETE it (404)
3. **List filters/search/sort/pagination:** seed 25 tasks across statuses and priorities, verify combined filter+search+sort+page returns correct subset and pagination metadata

## CI
GitHub Actions workflow:
- Job 1: backend (Python 3.12, install deps, run pytest against ephemeral Postgres service)
- Job 2: frontend (Node 20, install, `npm run lint && npm run build`)
- Triggered on push and PR

## What's Out of Scope
- Real-time updates (WebSockets/SSE)
- File attachments
- Activity log
- Docker / docker-compose
- Live deployment (README documents the path)

## Trade-offs
- **httpOnly cookie + body token:** Cookie gives automatic persistence and XSS resistance; body token allows API testing tools to work. Frontend will always use the cookie.
- **No Docker:** Setup is documented in README with explicit commands. Slightly more work for a reviewer but smaller repo footprint.
- **Admin role is seeded manually:** No "promote to admin" UI — admin is set via SQL or a CLI flag. Keeps auth surface small.
- **Search is `ILIKE %term%`:** Works without trigram extension if it's unavailable; if `pg_trgm` is present the GIN index accelerates it. Falls back gracefully.
