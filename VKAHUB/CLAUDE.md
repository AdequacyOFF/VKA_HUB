# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
make dev          # Start dev environment with hot reload
make dev-logs     # View logs
make dev-down     # Stop services

# URLs:
# Frontend: http://localhost:3001 | Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs | DB Admin: http://localhost:8080
```

## Commands

### Development

```bash
make dev              # Start with hot reload
make dev-logs         # View logs
make dev-down         # Stop
docker compose restart backend   # Restart specific service
```

### Production

```bash
make prod-up          # Start (frontend on port 3000)
make prod-down        # Stop
make restart          # Quick restart
```

### Database

```bash
docker compose exec backend alembic upgrade head              # Run migrations
docker compose exec backend alembic current                   # Check status
docker compose exec backend alembic revision -m "description" # Create migration
docker compose exec postgres psql -U vkahub                   # DB shell
# Adminer: http://localhost:8080 (Server: postgres, User: vkahub, Pass: vkahub_password)
```

### Testing

```bash
docker compose exec backend pytest                         # All backend tests
docker compose exec backend pytest tests/test_auth.py      # Single file
docker compose exec backend pytest -v --cov                # Verbose with coverage
docker compose exec frontend npm test                      # Frontend tests
```

### Container Access

```bash
docker compose exec backend bash                           # Backend shell
docker compose exec frontend sh                            # Frontend shell
docker exec -it vkahub_backend python                      # Python REPL
```

## Architecture

**VKA HUB**: Competition and team management platform for military academy students.

### Backend: Clean Architecture

```
backend/app/
├── domain/
│   ├── models/        # SQLAlchemy ORM entities (User, Team, Competition, etc.)
│   └── repositories/  # Abstract repository interfaces
├── use_cases/         # Business logic classes with execute() method
├── infrastructure/
│   ├── db/            # AsyncEngine, AsyncSession config
│   ├── repositories/  # Repository implementations
│   ├── security/      # JWT, bcrypt password hashing, permissions
│   └── storage/       # File uploads, report generation
└── presentation/
    ├── api/
    │   ├── routers/   # FastAPI endpoints
    │   ├── dtos/      # Pydantic v2 request/response schemas
    │   └── dependencies.py  # get_db, get_current_user, require_moderator
    └── middlewares/   # Error handling
```

**Patterns:**
- Async-first with AsyncSession (SQLAlchemy 2.0) + asyncpg driver
- Repository pattern: interfaces in domain, implementations in infrastructure
- Use case pattern: `LoginUseCase`, `CreateTeamUseCase`, etc. with `async def execute()`
- Dependency injection via FastAPI `Depends()`

### Frontend: React + TypeScript

```
frontend/src/
├── api/           # Axios instance + domain-specific clients
│   └── axios.ts   # Token refresh interceptor (auto-refreshes 401s)
├── components/    # Reusable UI, AuthCheck, ProfileCompletionCheck
├── pages/         # Auth, Profile, Teams, Competitions, Moderator
├── routes/        # React Router v6, ProtectedRoute, RoleProtectedRoute
├── store/         # Zustand with localStorage persistence
└── types/         # TypeScript interfaces matching backend DTOs
```

**Patterns:**
- Zustand stores persist to localStorage (auto-rehydrate on reload)
- Axios interceptor catches 401, calls `/api/auth/refresh`, retries request
- Protected routes check auth state; RoleProtectedRoute checks specific roles

### Authentication

- **Access token**: 15 minutes
- **Refresh token**: 7 days
- **Roles**: User, Captain, Moderator
- Tokens include `type` field ("access"/"refresh") to prevent confusion attacks
- Password recovery via security questions (not email)

### Database Schema (Key Tables)

- `users` - Accounts with profile, `is_banned` flag
- `teams`, `team_members`, `team_join_requests` - Team management
- `competitions`, `competition_cases`, `competition_stages` - Competition structure
- `competition_registrations` - Team applications to competitions
- `certificates` - User achievements
- `notifications` - Event notifications
- `user_complaints`, `platform_complaints` - Feedback system
- `moderator` - Moderator assignments

**20 Alembic migrations** in `backend/alembic/versions/` (must apply in sequence).

## Adding Features

### Backend Endpoint

1. DTO in `presentation/api/dtos/`
2. Use case in `use_cases/`
3. Router in `presentation/api/routers/`
4. Register in `main.py`: `app.include_router(router, prefix="/api/...")`

### Frontend Feature

1. API functions in `api/`
2. Types in `types/`
3. Components/pages in `components/` or `pages/`
4. Route in `routes/index.tsx`
5. Zustand store if needed in `store/`

### Migration

```bash
docker compose exec backend alembic revision -m "add_feature_table"
# Edit backend/alembic/versions/xxx_add_feature_table.py
docker compose exec backend alembic upgrade head
```

## Key Files

**Backend:**
- `main.py` - FastAPI app, router registration, CORS
- `config/settings.py` - Pydantic Settings (env vars)
- `infrastructure/db/database.py` - AsyncEngine/AsyncSession factory
- `infrastructure/security/jwt.py` - Token creation/validation
- `infrastructure/security/permissions.py` - `get_current_user`, `require_moderator`
- `docker-entrypoint.sh` - Runs migrations on startup

**Frontend:**
- `api/axios.ts` - Axios with token refresh interceptor
- `store/authStore.ts` - Auth state + localStorage persistence
- `routes/index.tsx` - Route definitions
- `components/AuthCheck.tsx` - Auth validation wrapper

**Config:**
- `docker-compose.yml` - Production services
- `docker-compose.dev.yml` - Dev overrides (bind mounts, hot reload)
- `Makefile` - Common commands

## Environment Variables

**backend/.env:**
```
DATABASE_URL=postgresql+asyncpg://vkahub:vkahub_password@postgres:5432/vkahub
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

**frontend/.env:**
```
VITE_API_URL=http://localhost:8000
```

## Gotchas

1. **Async/await required**: All DB operations must be awaited
2. **Use `Depends(get_db)`**: Never create sessions manually in routers
3. **Hot reload**: Works automatically in dev mode; changes apply without restart
4. **Dev port 3001, prod port 3000**: Don't confuse them
5. **Token refresh is automatic**: Frontend interceptor handles it
6. **User ID 1 protected**: Cannot delete/modify system user
7. **File uploads**: Check `MAX_UPLOAD_SIZE_MB` and allowed extensions in `storage/file_handler.py`
8. **CORS**: Frontend URL must be in `CORS_ORIGINS`

## API Endpoint Groups

- `/api/auth` - Login, register, refresh, password recovery
- `/api/users` - User management, profile updates, avatar upload
- `/api/teams` - Team CRUD, join requests, member management
- `/api/competitions` - Competition CRUD, cases, stages, registrations
- `/api/certificates` - Certificate uploads
- `/api/reports` - Competition reports
- `/api/moderator` - Admin dashboard, ban/unban users
- `/api/public` - Public endpoints (roles, skills list)
- `/api/users/complaints` - User complaints
- `/api/users/platform-complaints` - Platform feedback

Full interactive docs: http://localhost:8000/docs
