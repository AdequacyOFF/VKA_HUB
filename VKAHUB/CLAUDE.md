# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VKA HUB** is a full-stack competition and team management platform for military academy students built with FastAPI (Python) backend and React (TypeScript) frontend. The application manages student profiles, team formation, competition participation, certificates, and administrative oversight with role-based access control.

## Quick Start Commands

### Development Environment

```bash
# Start all services (recommended for development)
make dev
# Backend: http://localhost:8000 (auto-reload enabled)
# Frontend: http://localhost:3001 (Vite dev server with HMR)
# API Docs: http://localhost:8000/docs
# DB Admin: http://localhost:8080

# View logs
make dev-logs

# Stop services
make dev-down
```

### Production Environment

```bash
# Start in production mode
make prod-up
# Frontend: http://localhost:3000 (NGINX)

# Restart containers (no rebuild)
make restart

# Stop services
make prod-down
```

### Database Operations

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Check current migration
docker compose exec backend alembic current

# Create new migration
docker compose exec backend alembic revision -m "description"

# Access PostgreSQL shell
docker compose exec postgres psql -U vkahub
# Or use Adminer: http://localhost:8080 (Server: postgres, User: vkahub, Pass: vkahub_password, DB: vkahub)
```

### Testing

```bash
# Run backend tests
docker compose exec backend pytest

# Run backend tests with coverage
docker compose exec backend pytest --cov

# Run frontend tests
docker compose exec frontend npm test
```

### Container Access

```bash
# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

## Architecture Overview

### Backend: Clean Architecture Pattern

The backend follows Clean Architecture with four distinct layers:

**1. Domain Layer** (`backend/app/domain/`)
- **Models** (`models/`): SQLAlchemy ORM entities defining database schema (User, Team, Competition, Certificate, etc.)
- **Repositories** (`repositories/`): Abstract interfaces defining data access contracts
- Contains business entities and repository interfaces, independent of frameworks

**2. Application Layer** (`backend/app/use_cases/`)
- Implements business logic as use cases
- Each use case is a class with an `execute()` method
- Examples: `RegisterUseCase`, `LoginUseCase`, `CreateTeamUseCase`
- Orchestrates domain entities and enforces business rules

**3. Infrastructure Layer** (`backend/app/infrastructure/`)
- **Database** (`db/`): AsyncEngine and AsyncSession configuration
- **Repositories** (`repositories/`): Concrete implementations of repository interfaces
- **Security** (`security/`): JWT token creation/validation, password hashing (bcrypt), permission checking
- **Storage** (`storage/`): File upload handling and report generation
- Provides implementations for external dependencies

**4. Presentation Layer** (`backend/app/presentation/`)
- **Routers** (`api/routers/`): FastAPI endpoint handlers organized by feature (auth, users, teams, competitions, reports, moderator)
- **DTOs** (`api/dtos/`): Pydantic v2 schemas for request/response validation
- **Middleware** (`middlewares/`): Error handling, logging
- **Dependencies** (`api/dependencies.py`): FastAPI dependency injection (database sessions, current user, role checks)
- Handles HTTP layer and dependency injection

### Frontend: Component-Based Architecture

**React 18 + TypeScript** with the following structure:

- **Routing** (`src/routes/`): React Router v6 with protected routes
  - `ProtectedRoute`: Requires authentication
  - `RoleProtectedRoute`: Requires specific role (e.g., Moderator)

- **State Management** (`src/store/`): Zustand with localStorage persistence
  - `authStore`: User authentication state, tokens, moderator status
  - `userStore`, `teamStore`, `competitionStore`: Feature-specific state

- **API Layer** (`src/api/`): Axios instance with interceptors
  - Request interceptor: Adds JWT token to Authorization header
  - Response interceptor: Automatically refreshes expired tokens, retries failed requests

- **Components** (`src/components/`): Reusable UI components
  - `AuthCheck`: Validates authentication status
  - `ProfileCompletionCheck`: Ensures profile is complete
  - Feature-specific components organized by domain

- **Pages** (`src/pages/`): Full page components organized by feature (Auth, Teams, Competitions, Profile, Moderator)

- **Types** (`src/types/`): TypeScript interfaces for API responses and domain models

## Key Architectural Decisions

### 1. Async-First Design
- **Backend**: Fully async with AsyncSession (SQLAlchemy) and asyncpg driver
- **File Operations**: Uses `aiofiles` for non-blocking I/O
- **Why**: Maximizes scalability and performance under load

### 2. Repository Pattern
- Abstract repository interfaces in domain layer define contracts
- Concrete implementations in infrastructure layer
- Enables easy testing and dependency injection
- Pattern:
  ```python
  # Domain layer - interface
  class UserRepository(ABC):
      @abstractmethod
      async def get_by_login(self, login: str) -> Optional[User]: pass

  # Infrastructure layer - implementation
  class UserRepositoryImpl(UserRepository):
      async def get_by_login(self, login: str) -> Optional[User]:
          result = await self.db.execute(select(User).where(User.login == login))
          return result.scalar_one_or_none()
  ```

### 3. Use Case Pattern
- Each use case encapsulates a single business operation
- Instantiated per request with injected dependencies
- Pattern:
  ```python
  class LoginUseCase:
      def __init__(self, db: AsyncSession):
          self.db = db
          self.user_repo = UserRepositoryImpl(db)

      async def execute(self, login: str, password: str) -> dict:
          # Validate user, check ban status, verify password
          # Generate JWT tokens, return user + tokens
  ```

### 4. JWT Authentication with Token Refresh
- **Access tokens**: 15 minutes (configurable in settings)
- **Refresh tokens**: 7 days
- Tokens include `type` field ("access" or "refresh") to prevent token confusion attacks
- Frontend Axios interceptor automatically refreshes expired tokens and retries requests
- Password recovery uses security questions instead of email (fits military academy environment)

### 5. Role-Based Authorization
- **User Roles**: User, Captain, Moderator
- **Backend**: Uses dependency injection via `Depends(require_moderator)` or `Depends(get_current_user)`
- **Frontend**: `RoleProtectedRoute` wrapper checks user roles
- Moderator status stored in separate `Moderator` table for explicit tracking

### 6. Competition Structure
- Competitions have multiple **cases** (for hackathons with different scenarios)
- Competitions have multiple **stages** (for CTF-style events)
- Teams select a specific case when registering for competitions
- Competition types: HACKATHON, CTF, OTHER (enum in database)

### 7. Database Migration Strategy
- **Alembic** for database migrations in `backend/alembic/versions/`
- Migrations run automatically on container startup via `docker-entrypoint.sh`
- Always run migrations in order: `001` → `002` → ... → `020`
- Migration files are async-compatible using SQLAlchemy 2.0

### 8. Frontend State Persistence
- Auth state persists in browser localStorage via Zustand middleware
- Automatically rehydrates on page reload
- Users stay logged in across browser sessions until token expires

## Database Schema

### Core Tables

**users**
- User accounts with profile information (login, full_name, rank, position, study_group)
- Security: `password_hash`, `control_question`, `control_answer_hash` (for password recovery)
- Flags: `is_banned` (checked on every login)

**teams**
- Team information with captain relationship (`captain_id` → `users.id`)
- Fields: name, description, image, direction (CTF/Hackathon/etc.), max_members

**team_members**
- Team membership tracking (many-to-many: teams ↔ users)

**team_join_requests**
- Join request workflow with status enum: pending, approved, rejected

**competitions**
- Competition metadata with type enum: HACKATHON, CTF, OTHER
- Organizer-specific fields
- Status: upcoming, ongoing, completed

**competition_cases**
- Multiple cases per competition (for hackathons)

**competition_stages**
- Multiple stages per competition (for CTF)

**competition_registrations**
- Team applications to competitions
- Links to specific case selected by team

**competition_reports**
- Captain-submitted reports after competition completion

**certificates**
- User achievement tracking with file uploads

**roles**, **skills**
- Master data for user roles and skills (system and custom)

**user_roles**, **user_skills**
- Many-to-many relationships

**moderator**
- Moderator assignments with `assigned_by` tracking

**notifications**
- Event notification system

**complaints**
- User complaints and platform feedback

### Important Relationships

```
User
  ├── Has many: Roles, Skills, TeamMemberships, Certificates
  ├── Leads teams: Team.captain_id → User.id
  └── Creates competitions: Competition.created_by → User.id

Team
  ├── Belongs to captain (User)
  ├── Has many: TeamMembers, CompetitionRegistrations, JoinRequests
  └── Submits competition reports

Competition
  ├── Has many: Cases, Stages, Registrations, Reports
  └── Created by moderator (User)
```

## Authentication & Authorization Flow

### Login Flow

1. User submits login + password to `POST /api/auth/login`
2. `LoginUseCase` executes:
   - Finds user by login via `UserRepository`
   - Checks `is_banned` flag (returns 403 if banned)
   - Verifies password against `password_hash` using bcrypt
   - Generates access_token (15 min) and refresh_token (7 days)
3. Returns tokens + user data (including `is_moderator` flag)
4. Frontend stores tokens in localStorage via `authStore`
5. Subsequent requests include `Authorization: Bearer <access_token>`

### Token Refresh Flow

1. Request fails with 401 (token expired)
2. Axios response interceptor catches 401
3. Calls `POST /api/auth/refresh` with refresh_token
4. Backend validates refresh token:
   - Checks token type is "refresh"
   - Validates signature and expiration
   - Generates new access_token and refresh_token
5. Frontend updates tokens in authStore
6. Retries original request with new access_token
7. Returns successful response to component

### Authorization Checks

**Backend Dependencies**:
```python
# Requires any authenticated user
current_user: User = Depends(get_current_user)

# Requires moderator role
current_user: User = Depends(require_moderator)

# Optional authentication
current_user: Optional[User] = Depends(get_optional_current_user)
```

**Frontend Route Protection**:
```typescript
// Requires authentication
<ProtectedRoute><SomePage /></ProtectedRoute>

// Requires specific role
<RoleProtectedRoute allowedRoles={['Moderator']}>
  <ModeratorDashboard />
</RoleProtectedRoute>
```

## Common Development Patterns

### Adding a New Backend Endpoint

1. **Create DTO** in `backend/app/presentation/api/dtos/`
2. **Create Use Case** in `backend/app/use_cases/`
3. **Create Router** in `backend/app/presentation/api/routers/`
4. **Register Router** in `backend/app/main.py`

Example:
```python
# 1. DTO (presentation/api/dtos/feature.py)
class CreateFeatureRequest(BaseModel):
    name: str
    description: Optional[str]

# 2. Use Case (use_cases/features/create_feature.py)
class CreateFeatureUseCase:
    async def execute(self, name: str, description: str) -> Feature:
        # Business logic here
        pass

# 3. Router (presentation/api/routers/features.py)
@router.post("", response_model=FeatureResponse)
async def create_feature(
    data: CreateFeatureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    use_case = CreateFeatureUseCase(db)
    feature = await use_case.execute(**data.dict())
    return FeatureResponse.from_orm(feature)

# 4. Register (main.py)
app.include_router(features.router, prefix="/api/features")
```

### Adding a New Frontend Feature

1. **Create API Functions** in `frontend/src/api/`
2. **Define TypeScript Types** in `frontend/src/types/`
3. **Create Components** in `frontend/src/components/` or `src/pages/`
4. **Add Route** in `frontend/src/routes/index.tsx`
5. **Update State** (if needed) in `frontend/src/store/`

Example:
```typescript
// 1. API (api/features.ts)
export const featuresAPI = {
  getAll: async () => {
    const response = await api.get('/api/features');
    return response.data;
  }
};

// 2. Types (types/feature.ts)
export interface Feature {
  id: number;
  name: string;
  description?: string;
}

// 3. Component (pages/Features/FeaturesList.tsx)
export function FeaturesList() {
  const [features, setFeatures] = useState<Feature[]>([]);
  useEffect(() => {
    featuresAPI.getAll().then(setFeatures);
  }, []);
  // Render logic...
}

// 4. Route (routes/index.tsx)
{
  path: '/features',
  element: <ProtectedRoute><FeaturesList /></ProtectedRoute>
}
```

### Adding a Database Migration

```bash
# 1. Create migration file
docker compose exec backend alembic revision -m "add new feature table"

# 2. Edit the generated file in backend/alembic/versions/
# Add upgrade() and downgrade() logic

# 3. Apply migration
docker compose exec backend alembic upgrade head

# 4. Verify
docker compose exec backend alembic current
```

## Important Files Reference

### Backend Critical Files
- `backend/app/main.py` - FastAPI app initialization, router registration, CORS setup
- `backend/app/config/settings.py` - Environment configuration (Pydantic Settings)
- `backend/app/infrastructure/db/database.py` - AsyncEngine and AsyncSession factory
- `backend/app/infrastructure/security/jwt.py` - Token creation and validation
- `backend/app/infrastructure/security/permissions.py` - Auth dependencies (`get_current_user`, `require_moderator`)
- `backend/alembic/env.py` - Async migration runner
- `backend/docker-entrypoint.sh` - Container startup script (runs migrations)

### Frontend Critical Files
- `frontend/src/routes/index.tsx` - Router configuration
- `frontend/src/api/axios.ts` - Axios instance with token refresh interceptor
- `frontend/src/store/authStore.ts` - Auth state with localStorage persistence
- `frontend/src/components/AuthCheck.tsx` - Auth validation wrapper
- `frontend/src/components/ProfileCompletionCheck.tsx` - Profile validation wrapper

### Configuration Files
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies
- `docker-compose.yml` - Production service orchestration
- `docker-compose.dev.yml` - Development overrides (bind mounts, hot reload)
- `Makefile` - Common commands for development and deployment

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql+asyncpg://vkahub:vkahub_password@postgres:5432/vkahub
SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

## Common Gotchas & Tips

1. **Always use async/await**: All database operations must be awaited; never block the event loop
2. **Database sessions**: Always use `Depends(get_db)` in routers; don't create sessions manually
3. **CORS configuration**: Frontend URL must be in `CORS_ORIGINS` in backend settings
4. **Migration order**: Migrations must be applied in sequence; check migration history before creating new ones
5. **Token refresh is automatic**: Frontend Axios interceptor handles token refresh; no manual handling needed in components
6. **File uploads**: Check `MAX_UPLOAD_SIZE_MB` setting and allowed extensions in `infrastructure/storage/file_handler.py`
7. **Error handling**: Global error handler in `presentation/middlewares/error_handler.py` catches all exceptions
8. **Logging**: Use Python's `logging` module; configured in `config/logging.py`
9. **System user protection**: User ID 1 (system user) cannot be deleted or modified; enforced in `security/system_user_protection.py`
10. **Hot reload**: In dev mode, code changes apply automatically (backend via Uvicorn `--reload`, frontend via Vite HMR)

## Technology Stack

### Backend
- **FastAPI 0.109.0** - Modern async Python web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL 15** - Database
- **asyncpg** - Async PostgreSQL driver
- **Alembic 1.13.1** - Database migrations
- **Pydantic v2** - Data validation
- **python-jose** - JWT implementation
- **passlib + bcrypt** - Password hashing
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript 5.3** - Type safety
- **Vite 5.0** - Build tool with HMR
- **Mantine UI 7.4** - Component library
- **Zustand 4.4** - State management
- **React Query** (@tanstack/react-query) - Server state
- **React Router v6** - Routing
- **React Hook Form + Zod** - Form validation
- **Axios 1.6** - HTTP client
- **Recharts 3.5** - Data visualization

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **NGINX** - Frontend web server (production)
- **Adminer** - Database admin UI

## API Documentation

Full interactive API documentation available at http://localhost:8000/docs (Swagger UI) when running the backend.

### Key Endpoint Groups

**Authentication** (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - Login and token generation
- `POST /refresh` - Token refresh
- `POST /recover-password` - Password recovery via security question

**Users** (`/api/users`)
- `GET /` - List users (with filtering)
- `GET /{id}` - User details
- `PUT /{id}/profile` - Update profile
- `POST /{id}/avatar` - Upload avatar

**Teams** (`/api/teams`)
- `GET /` - List teams
- `POST /` - Create team (requires Captain role)
- `GET /{id}` - Team details
- `POST /{id}/join` - Request to join team
- `PATCH /{id}/requests/{request_id}` - Approve/reject join request

**Competitions** (`/api/competitions`)
- `GET /` - List competitions
- `POST /` - Create competition (requires Moderator)
- `GET /{id}` - Competition details
- `POST /{id}/register` - Register team for competition

**Reports** (`/api/reports`)
- `POST /` - Submit captain report
- `GET /{id}` - Download report

**Moderator** (`/api/moderator`)
- `GET /dashboard` - Admin dashboard statistics
- `POST /users/{id}/ban` - Ban user
- `POST /competitions` - Create competition
- Various management endpoints
