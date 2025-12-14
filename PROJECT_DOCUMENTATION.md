# VKA Hub - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Database Schema](#database-schema)
8. [Data Flow & Communication](#data-flow--communication)
9. [Key Features Implementation](#key-features-implementation)
10. [Security Implementation](#security-implementation)
11. [Development & Deployment](#development--deployment)

---

## Project Overview

**VKA Hub** (ВКА Hub - Hackathon) is a full-stack web application designed for managing military academy student competitions, teams, and achievements. It's a comprehensive platform for organizing hackathons, competitions, and team management with role-based access control.

### Target Users
- **Regular Users/Students** - Can view competitions, join teams, manage certificates
- **Team Captains** - Additional rights to create teams, manage members, approve join requests
- **Moderators** - Can manage all users, teams, competitions, generate reports
- **System Administrators** - Full system access

### Core Purpose
Provide a centralized platform for:
- Student registration and profile management
- Team formation and collaboration
- Competition organization and participation
- Certificate and achievement tracking
- Administrative oversight and analytics

---

## Technology Stack

### Backend Technologies
```yaml
Framework: FastAPI 0.109.0
Language: Python 3.11+
ORM: SQLAlchemy 2.0 (Async)
Database: PostgreSQL 15
DB Driver: asyncpg
Migrations: Alembic 1.13.1
Authentication: JWT (python-jose + cryptography)
Password Security: bcrypt (passlib)
Validation: Pydantic v2
File Handling: aiofiles, python-docx, Pillow
Testing: pytest, pytest-asyncio, faker
Server: Uvicorn (ASGI)
```

### Frontend Technologies
```yaml
Framework: React 18
Language: TypeScript 5.3
Build Tool: Vite 5.0.11
UI Library: Mantine UI 7.4.0
State Management: Zustand 4.4.7
Server State: React Query (@tanstack/react-query)
Routing: React Router v6
Forms: React Hook Form + Zod validation
HTTP Client: Axios 1.6.5
Charts: Recharts 3.5.1
Icons: Tabler Icons React
Dates: dayjs
```

### Infrastructure
```yaml
Containerization: Docker + Docker Compose
Web Server: NGINX (production)
DB Admin: Adminer
```

---

## Architecture Overview

### Backend: Clean Architecture / Layered Architecture

The backend follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│           PRESENTATION LAYER                    │
│  (HTTP Interface - Routers, DTOs, Middleware)  │
├─────────────────────────────────────────────────┤
│           APPLICATION LAYER                     │
│  (Business Logic - Use Cases)                   │
├─────────────────────────────────────────────────┤
│           DOMAIN LAYER                          │
│  (Business Entities - Models, Repositories)     │
├─────────────────────────────────────────────────┤
│           INFRASTRUCTURE LAYER                  │
│  (Implementation - Database, Security, Files)   │
└─────────────────────────────────────────────────┘
```

#### Layer Responsibilities

**1. Domain Layer** (`app/domain/`)
- Defines business entities (SQLAlchemy models)
- Defines repository interfaces (abstract base classes)
- Contains pure business logic
- Independent of frameworks and external dependencies

**2. Application Layer** (`app/use_cases/`)
- Implements business use cases
- Orchestrates domain entities
- Examples: `RegisterUseCase`, `LoginUseCase`, `CreateTeamUseCase`

**3. Infrastructure Layer** (`app/infrastructure/`)
- Implements repository interfaces
- Database connection management
- Security implementations (JWT, password hashing)
- File storage and report generation
- External service integrations

**4. Presentation Layer** (`app/presentation/`)
- HTTP API endpoints (FastAPI routers)
- Request/Response DTOs (Pydantic models)
- Dependency injection setup
- Middleware and error handlers

### Frontend: Component-Based Architecture

```
┌─────────────────────────────────────────┐
│         PAGES (Route Components)        │
├─────────────────────────────────────────┤
│         COMPONENTS (Reusable UI)        │
├─────────────────────────────────────────┤
│    STATE MANAGEMENT (Zustand Stores)    │
├─────────────────────────────────────────┤
│      API LAYER (Axios + React Query)    │
└─────────────────────────────────────────┘
```

---

## Project Structure

### Root Directory
```
VKA_Hub/
├── backend/                    # FastAPI Python Backend
├── frontend/                   # React TypeScript Frontend
├── docker-compose.yml          # Multi-container orchestration
├── .env.example               # Environment template
├── test_api.sh                # API testing script
└── README.md                  # Project documentation
```

### Backend Structure (`/backend`)

```
backend/
├── app/
│   ├── config/                         # Configuration
│   │   ├── settings.py                 # Application settings (DATABASE_URL, JWT, CORS)
│   │   └── logging.py                  # Logging configuration
│   │
│   ├── domain/                         # Domain Layer
│   │   ├── models/                     # SQLAlchemy ORM Models (17 models)
│   │   │   ├── user.py                 # User entity with roles/skills
│   │   │   ├── team.py                 # Team entity
│   │   │   ├── competition.py          # Competition entity
│   │   │   ├── certificate.py          # Certificate entity
│   │   │   ├── role.py                 # Role entity
│   │   │   ├── skill.py                # Skill entity
│   │   │   ├── competition_registration.py
│   │   │   ├── team_member.py
│   │   │   ├── team_join_request.py
│   │   │   ├── captain_report.py
│   │   │   ├── user_activity.py
│   │   │   └── ... (6 more models)
│   │   │
│   │   └── repositories/               # Repository Interfaces (ABCs)
│   │       ├── user_repository.py
│   │       ├── team_repository.py
│   │       ├── competition_repository.py
│   │       ├── certificate_repository.py
│   │       ├── report_repository.py
│   │       └── moderator_repository.py
│   │
│   ├── use_cases/                      # Application Logic
│   │   ├── auth/
│   │   │   ├── register.py             # User registration logic
│   │   │   ├── login.py                # Authentication logic
│   │   │   └── recover_password.py     # Password recovery
│   │   ├── teams/
│   │   │   └── create_team.py          # Team creation logic
│   │   ├── certificates/
│   │   ├── competitions/
│   │   ├── moderators/
│   │   ├── reports/
│   │   └── user/
│   │       └── update_profile.py       # Profile update logic
│   │
│   ├── infrastructure/                 # Infrastructure Layer
│   │   ├── db/
│   │   │   ├── database.py             # AsyncEngine, Session factory
│   │   │   └── base.py                 # SQLAlchemy declarative base
│   │   │
│   │   ├── repositories/               # Concrete Repository Implementations
│   │   │   ├── user_repository_impl.py
│   │   │   ├── team_repository_impl.py
│   │   │   ├── competition_repository_impl.py
│   │   │   ├── certificate_repository_impl.py
│   │   │   ├── report_repository_impl.py
│   │   │   └── moderator_repository_impl.py
│   │   │
│   │   ├── security/
│   │   │   ├── jwt.py                  # Token creation/validation
│   │   │   ├── password.py             # bcrypt hashing/verification
│   │   │   ├── permissions.py          # Role-based authorization
│   │   │   └── system_user_protection.py
│   │   │
│   │   └── storage/
│   │       ├── file_handler.py         # File upload management
│   │       └── report_generator.py     # .docx report generation
│   │
│   ├── presentation/                   # Presentation Layer
│   │   ├── api/
│   │   │   ├── routers/                # API Route Handlers
│   │   │   │   ├── auth.py             # /auth endpoints (142 lines)
│   │   │   │   ├── users.py            # /users endpoints (568 lines)
│   │   │   │   ├── teams.py            # /teams endpoints (525 lines)
│   │   │   │   ├── competitions.py     # /competitions endpoints (182 lines)
│   │   │   │   ├── certificates.py     # /certificates endpoints (164 lines)
│   │   │   │   ├── reports.py          # /reports endpoints (68 lines)
│   │   │   │   └── moderator.py        # /moderator endpoints (131 lines)
│   │   │   │
│   │   │   ├── dtos/                   # Data Transfer Objects (Pydantic)
│   │   │   │   ├── auth.py             # Auth request/response schemas
│   │   │   │   ├── user.py             # User DTOs
│   │   │   │   ├── team.py             # Team DTOs
│   │   │   │   ├── competition.py      # Competition DTOs
│   │   │   │   ├── certificate.py      # Certificate DTOs
│   │   │   │   ├── report.py           # Report DTOs
│   │   │   │   └── moderator.py        # Moderator DTOs
│   │   │   │
│   │   │   └── dependencies.py         # FastAPI dependency injection
│   │   │
│   │   └── middlewares/
│   │       └── error_handler.py        # Global exception handling
│   │
│   └── main.py                         # FastAPI app initialization
│
├── alembic/                            # Database Migrations
│   ├── versions/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_timestamp_defaults.py
│   │   ├── 003_seed_roles_and_skills.py
│   │   └── 004_add_join_request_status_enum.py
│   └── env.py
│
├── tests/                              # Test Suite
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_roles_skills.py
│
├── static/                             # Static file uploads
├── requirements.txt                     # Python dependencies
├── Dockerfile                          # Backend containerization
├── docker-entrypoint.sh               # Container startup script
└── alembic.ini                        # Alembic configuration
```

### Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── api/                           # API Client Layer
│   │   ├── axios.ts                   # Axios instance with JWT interceptors
│   │   ├── auth.ts                    # Authentication API calls
│   │   ├── users.ts                   # User API calls
│   │   ├── teams.ts                   # Team API calls
│   │   ├── competitions.ts            # Competition API calls
│   │   ├── certificates.ts            # Certificate API calls
│   │   ├── reports.ts                 # Report API calls
│   │   ├── moderator.ts               # Moderator API calls
│   │   └── index.ts                   # API exports
│   │
│   ├── components/                    # Reusable Components
│   │   ├── AuthCheck.tsx              # Authentication guard component
│   │   ├── ProfileCompletionCheck.tsx # Profile validation component
│   │   │
│   │   ├── auth/                      # Auth-related components
│   │   │
│   │   ├── common/                    # Shared UI Components (13 files)
│   │   │   ├── VTBButton.tsx          # Custom styled button
│   │   │   ├── VTBCard.tsx            # Card component
│   │   │   ├── AvatarUploader.tsx     # Avatar upload component
│   │   │   ├── FileUploader.tsx       # File upload component
│   │   │   ├── MultiSelectRoles.tsx   # Multi-select for roles
│   │   │   ├── MultiSelectSkills.tsx  # Multi-select for skills
│   │   │   ├── UserCard.tsx           # User display card
│   │   │   ├── TeamCard.tsx           # Team display card
│   │   │   ├── CompetitionCard.tsx    # Competition display card
│   │   │   └── ...
│   │   │
│   │   ├── certificate/               # Certificate components
│   │   ├── competition/               # Competition components
│   │   ├── moderator/                 # Moderator panel components
│   │   ├── profile/                   # Profile components
│   │   ├── team/                      # Team components
│   │   └── user/                      # User components
│   │
│   ├── pages/                         # Full Page Components
│   │   ├── Home.tsx                   # Landing page
│   │   │
│   │   ├── Auth/                      # Authentication Pages
│   │   │   ├── Login.tsx              # Login page
│   │   │   ├── Register.tsx           # Registration page
│   │   │   └── Recovery.tsx           # Password recovery page
│   │   │
│   │   ├── Profile/                   # User Profile
│   │   │   └── tabs/                  # 7 profile tabs
│   │   │       ├── GeneralInfo.tsx
│   │   │       ├── Certificates.tsx
│   │   │       ├── RolesSkills.tsx
│   │   │       ├── TeamHistory.tsx
│   │   │       ├── CurrentTeam.tsx
│   │   │       ├── Competitions.tsx
│   │   │       └── ActivityLog.tsx
│   │   │
│   │   ├── Users/                     # User Management
│   │   │   ├── UsersList.tsx          # Browse all users
│   │   │   └── UserDetail.tsx         # Individual user page
│   │   │
│   │   ├── Teams/                     # Team Management
│   │   │   ├── TeamsList.tsx          # Browse teams
│   │   │   ├── TeamDetail.tsx         # Team details
│   │   │   ├── CreateTeam.tsx         # Team creation form
│   │   │   ├── EditTeam.tsx           # Team editing form
│   │   │   ├── TeamReports.tsx        # Team reports view
│   │   │   └── TeamRequests.tsx       # Join request management
│   │   │
│   │   ├── Competitions/              # Competition Management
│   │   │   ├── CompetitionsList.tsx   # Browse competitions
│   │   │   └── CompetitionDetail.tsx  # Competition details
│   │   │
│   │   └── Moderator/                 # Admin Panel (7 pages)
│   │       ├── ModeratorDashboard.tsx # Admin dashboard
│   │       ├── ModeratorUsers.tsx     # User management
│   │       ├── ModeratorTeams.tsx     # Team management
│   │       ├── ModeratorCompetitions.tsx # Competition management
│   │       ├── ModeratorReports.tsx   # Report management
│   │       ├── ModeratorModerators.tsx # Moderator management
│   │       └── ModeratorAnalytics.tsx # Analytics & charts
│   │
│   ├── routes/                        # Routing Configuration
│   │   ├── index.tsx                  # Main router (3 route groups)
│   │   ├── ProtectedRoute.tsx         # Authentication guard
│   │   └── RoleProtectedRoute.tsx     # Role-based authorization guard
│   │
│   ├── store/                         # Zustand State Management
│   │   ├── authStore.ts               # Auth state + localStorage persistence
│   │   ├── userStore.ts               # User state
│   │   ├── teamStore.ts               # Team state
│   │   ├── competitionStore.ts        # Competition state
│   │   ├── themeStore.ts              # Theme preferences
│   │   └── index.ts                   # Store exports
│   │
│   ├── types/                         # TypeScript Type Definitions
│   │   ├── index.ts                   # Common types
│   │   ├── auth.ts                    # Auth types
│   │   ├── user.ts                    # User types
│   │   ├── team.ts                    # Team types
│   │   ├── competition.ts             # Competition types
│   │   ├── certificate.ts             # Certificate types
│   │   ├── report.ts                  # Report types
│   │   └── api.ts                     # API response types
│   │
│   ├── utils/                         # Utility Functions
│   │   ├── errorHandler.ts            # Error handling/display
│   │   └── navigation.ts              # Navigation utilities
│   │
│   ├── hooks/                         # Custom React Hooks
│   │
│   ├── layouts/                       # Layout Components
│   │   ├── AuthLayout.tsx             # Layout for auth pages
│   │   ├── MainLayout.tsx             # Main app layout
│   │   └── ModeratorLayout.tsx        # Admin panel layout
│   │
│   ├── styles/
│   │   └── glassmorphism.css          # VTB-inspired styling
│   │
│   ├── assets/                        # Static assets
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # React entry point
│   └── vite-env.d.ts                  # Vite type definitions
│
├── public/                            # Public static assets
├── package.json                       # NPM dependencies
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite build config
├── .env                              # Environment variables
├── Dockerfile                        # Frontend containerization
├── nginx.conf                        # NGINX configuration
└── index.html                        # HTML entry point
```

---

## Backend Architecture

### Entry Point: `main.py`

The FastAPI application is initialized in `/backend/app/main.py`:

```python
# Key initialization steps:
1. Create FastAPI app instance
2. Add CORS middleware (for frontend communication)
3. Register global exception handlers:
   - HTTPException handler
   - ValidationException handler
   - SQLAlchemyError handler
   - Generic exception handler
4. Mount static file directory ("/static")
5. Include all API routers:
   - /auth (authentication endpoints)
   - /users (user management)
   - /teams (team management)
   - /competitions (competition management)
   - /certificates (certificate management)
   - /reports (report management)
   - /moderator (admin endpoints)
6. Startup event:
   - Create upload directories
   - Initialize default system user
7. Health check endpoint (GET /)
```

### Dependency Injection Pattern

FastAPI uses dependency injection extensively. Key dependencies in `dependencies.py`:

**1. Database Session Dependency**
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    # Yields database session for each request
    # Automatically commits or rolls back on exception
```

**2. Current User Dependency**
```python
async def get_current_user(token: str, db: AsyncSession) -> User:
    # Validates JWT token
    # Retrieves user from database
    # Returns authenticated user object
    # Raises 401 if invalid
```

**3. Role-Based Authorization**
```python
def require_role(*allowed_roles: str):
    # Returns dependency that checks if user has required role
    # Raises 403 if user lacks permission
```

### Repository Pattern Implementation

**Interface (Abstract Base Class)**
```python
# app/domain/repositories/user_repository.py
class UserRepository(ABC):
    @abstractmethod
    async def create(self, user: User) -> User:
        pass

    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    async def get_by_login(self, login: str) -> Optional[User]:
        pass

    # ... more methods
```

**Implementation**
```python
# app/infrastructure/repositories/user_repository_impl.py
class UserRepositoryImpl(UserRepository):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    # ... implementations for all abstract methods
```

### Use Case Pattern

Use cases encapsulate business logic:

```python
# app/use_cases/auth/register.py
class RegisterUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, login: str, password: str, ...) -> User:
        # 1. Validate input
        if await self.user_repo.get_by_login(login):
            raise ValueError("Login already exists")

        # 2. Hash password
        hashed_password = hash_password(password)

        # 3. Create user entity
        user = User(
            login=login,
            password_hash=hashed_password,
            ...
        )

        # 4. Save to database
        return await self.user_repo.create(user)
```

### API Router Structure

Routers handle HTTP requests and responses:

```python
# app/presentation/api/routers/auth.py
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    # 1. Create repository
    user_repo = UserRepositoryImpl(db)

    # 2. Create use case
    use_case = RegisterUseCase(user_repo)

    # 3. Execute use case
    user = await use_case.execute(**data.dict())

    # 4. Return response DTO
    return UserResponse.from_orm(user)
```

### Database Models

SQLAlchemy models define database schema:

```python
# app/domain/models/user.py
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    login = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    avatar = Column(String(255))
    rank = Column(String(100))
    position = Column(String(100))
    study_group = Column(String(50))
    security_question = Column(String(255))
    security_answer_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    activities = relationship("UserActivity", back_populates="user")
```

### Key Backend Models (17 total)

1. **User** - User accounts with authentication
2. **Role** - User roles (User, Captain, Moderator)
3. **UserRole** - Many-to-many: Users ↔ Roles
4. **Skill** - Skill definitions (Programming, Design, etc.)
5. **UserSkill** - Many-to-many: Users ↔ Skills
6. **Team** - Team entity
7. **TeamMember** - Team membership tracking
8. **TeamJoinRequest** - Join request workflow
9. **Competition** - Competition entity
10. **CompetitionRegistration** - Team competition registrations
11. **Certificate** - User certificates/achievements
12. **CaptainReport** - Captain reports for competitions
13. **ModeratorReport** - Moderator-generated reports
14. **UserActivity** - Activity logging
15. **CompetitionParticipation** - Individual participation tracking
16. **TeamHistory** - Historical team membership
17. **SystemUser** - Protected system user

---

## Frontend Architecture

### Entry Point Flow

**1. HTML Entry (`/frontend/index.html`)**
```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

**2. React Entry (`/frontend/src/main.tsx`)**
```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**3. App Component (`/frontend/src/App.tsx`)**
```typescript
function App() {
  return (
    <MantineProvider theme={customTheme}>  {/* UI theming */}
      <QueryClientProvider client={queryClient}>  {/* React Query */}
        <Notifications />  {/* Toast notifications */}
        <AppRouter />  {/* React Router */}
      </QueryClientProvider>
    </MantineProvider>
  )
}
```

**4. Router (`/frontend/src/routes/index.tsx`)**
```typescript
// Three main route groups:

1. Public Auth Routes (/auth/*)
   - /auth/login
   - /auth/register
   - /auth/recovery

2. Protected User Routes (/)
   - / (home)
   - /profile
   - /users
   - /users/:id
   - /teams
   - /teams/:id
   - /competitions
   - /competitions/:id

3. Role-Protected Moderator Routes (/moderator/*)
   - /moderator/dashboard
   - /moderator/users
   - /moderator/teams
   - /moderator/competitions
   - /moderator/reports
   - /moderator/moderators
   - /moderator/analytics
```

### State Management: Zustand

Zustand provides lightweight state management:

**Auth Store** (`/frontend/src/store/authStore.ts`)
```typescript
interface AuthState {
  // State
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // Actions
  login: (user: User, tokens: Tokens) => void
  logout: () => void
  updateUser: (user: User) => void
  setTokens: (tokens: Tokens) => void
}

// Store with localStorage persistence
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, tokens) => set({
        user,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true
      }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      }),

      // ... other actions
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      })
    }
  )
)
```

**Usage in Components**
```typescript
function ProfilePage() {
  const { user, logout } = useAuthStore()

  return (
    <div>
      <h1>Welcome, {user?.full_name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### API Layer: Axios with Interceptors

**Axios Instance** (`/frontend/src/api/axios.ts`)
```typescript
// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
})

// Request interceptor - Add JWT token to headers
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Call refresh endpoint
        const { refreshToken } = useAuthStore.getState()
        const response = await axios.post('/auth/refresh', {
          refresh_token: refreshToken
        })

        // Update tokens in store
        const { access_token, refresh_token } = response.data
        useAuthStore.getState().setTokens({
          access_token,
          refresh_token
        })

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
```

**API Functions** (`/frontend/src/api/auth.ts`)
```typescript
export const authAPI = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (login: string, password: string) => {
    const response = await api.post('/auth/login', { login, password })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me')
    return response.data
  },

  // ... more auth methods
}
```

### Route Protection

**Protected Route Component** (`/frontend/src/routes/ProtectedRoute.tsx`)
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <AuthCheck>  {/* Validates token is still valid */}
      <ProfileCompletionCheck>  {/* Ensures profile is complete */}
        {children}
      </ProfileCompletionCheck>
    </AuthCheck>
  )
}
```

**Role-Protected Route** (`/frontend/src/routes/RoleProtectedRoute.tsx`)
```typescript
function RoleProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) {
  const { user } = useAuthStore()

  const hasRequiredRole = user?.roles?.some(role =>
    allowedRoles.includes(role.role.name)
  )

  if (!hasRequiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Usage
<RoleProtectedRoute allowedRoles={['Moderator']}>
  <ModeratorDashboard />
</RoleProtectedRoute>
```

### Component Patterns

**Page Component Example** (`/frontend/src/pages/Teams/TeamsList.tsx`)
```typescript
function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const data = await teamsAPI.getAll()
      setTeams(data)
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'Failed to load teams',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout>
      <TextInput
        placeholder="Search teams..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading ? (
        <Loader />
      ) : (
        <Grid>
          {filteredTeams.map(team => (
            <Grid.Col key={team.id} span={4}>
              <TeamCard team={team} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </MainLayout>
  )
}
```

---

## Database Schema

### Core Tables

**users**
```sql
- id (PK)
- login (unique)
- password_hash
- full_name
- avatar
- rank
- position
- study_group
- security_question
- security_answer_hash
- created_at
- updated_at
```

**roles**
```sql
- id (PK)
- name (User, Captain, Moderator)
- description
- created_at
```

**user_roles** (junction table)
```sql
- id (PK)
- user_id (FK → users.id)
- role_id (FK → roles.id)
- assigned_at
```

**skills**
```sql
- id (PK)
- name (Programming, Design, Management, etc.)
- category
- created_at
```

**user_skills** (junction table)
```sql
- id (PK)
- user_id (FK → users.id)
- skill_id (FK → skills.id)
- assigned_at
```

**teams**
```sql
- id (PK)
- name
- description
- image
- captain_id (FK → users.id)
- max_members
- created_at
- updated_at
```

**team_members**
```sql
- id (PK)
- team_id (FK → teams.id)
- user_id (FK → users.id)
- joined_at
```

**team_join_requests**
```sql
- id (PK)
- team_id (FK → teams.id)
- user_id (FK → users.id)
- status (pending, approved, rejected)
- created_at
- processed_at
```

**competitions**
```sql
- id (PK)
- name
- description
- image
- start_date
- end_date
- location
- status (upcoming, ongoing, completed)
- max_teams
- created_at
- updated_at
```

**competition_registrations**
```sql
- id (PK)
- competition_id (FK → competitions.id)
- team_id (FK → teams.id)
- registered_at
- status (registered, confirmed, cancelled)
```

**certificates**
```sql
- id (PK)
- user_id (FK → users.id)
- title
- description
- file_path
- issued_at
- created_at
```

**captain_reports**
```sql
- id (PK)
- competition_id (FK → competitions.id)
- team_id (FK → teams.id)
- captain_id (FK → users.id)
- content
- submitted_at
```

**moderator_reports**
```sql
- id (PK)
- moderator_id (FK → users.id)
- title
- file_path
- generated_at
```

**user_activities**
```sql
- id (PK)
- user_id (FK → users.id)
- action (login, update_profile, join_team, etc.)
- details (JSON)
- created_at
```

### Database Relationships

```
User
  ├── 1:N → UserRole → N:1 → Role
  ├── 1:N → UserSkill → N:1 → Skill
  ├── 1:N → TeamMember → N:1 → Team
  ├── 1:N → TeamJoinRequest
  ├── 1:N → Certificate
  ├── 1:N → UserActivity
  └── 1:N → CaptainReport

Team
  ├── 1:1 → User (captain)
  ├── 1:N → TeamMember
  ├── 1:N → TeamJoinRequest
  ├── 1:N → CompetitionRegistration
  └── 1:N → CaptainReport

Competition
  ├── 1:N → CompetitionRegistration
  └── 1:N → CaptainReport
```

---

## Data Flow & Communication

### Complete Request Flow Example: User Login

**1. Frontend User Action**
```typescript
// User submits login form in Login.tsx
const handleSubmit = async (values: { login: string; password: string }) => {
  try {
    // Call API layer
    const response = await authAPI.login(values.login, values.password)

    // Update auth store
    useAuthStore.getState().login(response.user, {
      access_token: response.access_token,
      refresh_token: response.refresh_token
    })

    // Navigate to home
    navigate('/')
  } catch (error) {
    showNotification({
      title: 'Login Failed',
      message: error.message,
      color: 'red'
    })
  }
}
```

**2. API Layer**
```typescript
// authAPI.login() in api/auth.ts
export const authAPI = {
  login: async (login: string, password: string) => {
    const response = await api.post('/auth/login', { login, password })
    return response.data
  }
}
```

**3. HTTP Request**
```http
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "login": "user123",
  "password": "password123"
}
```

**4. Backend Router**
```python
# app/presentation/api/routers/auth.py
@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Create repository
    user_repo = UserRepositoryImpl(db)

    # Create use case
    use_case = LoginUseCase(user_repo)

    # Execute business logic
    result = await use_case.execute(data.login, data.password)

    return LoginResponse(**result)
```

**5. Use Case (Business Logic)**
```python
# app/use_cases/auth/login.py
class LoginUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, login: str, password: str) -> dict:
        # 1. Find user by login
        user = await self.user_repo.get_by_login(login)
        if not user:
            raise ValueError("Invalid credentials")

        # 2. Verify password
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        # 3. Generate JWT tokens
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        # 4. Log activity
        await self.user_repo.log_activity(
            user.id,
            "login",
            {"timestamp": datetime.utcnow()}
        )

        # 5. Return user and tokens
        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }
```

**6. Repository (Data Access)**
```python
# app/infrastructure/repositories/user_repository_impl.py
class UserRepositoryImpl(UserRepository):
    async def get_by_login(self, login: str) -> Optional[User]:
        query = select(User).where(User.login == login)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def log_activity(self, user_id: int, action: str, details: dict):
        activity = UserActivity(
            user_id=user_id,
            action=action,
            details=json.dumps(details)
        )
        self.db.add(activity)
        await self.db.commit()
```

**7. Database Query**
```sql
-- SQLAlchemy generates this query
SELECT users.id, users.login, users.password_hash, ...
FROM users
WHERE users.login = 'user123';
```

**8. Response to Frontend**
```json
{
  "user": {
    "id": 1,
    "login": "user123",
    "full_name": "John Doe",
    "roles": [{"name": "User"}],
    "skills": [{"name": "Programming"}]
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**9. Frontend State Update**
```typescript
// Auth store updates
{
  user: { id: 1, login: 'user123', ... },
  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
  isAuthenticated: true
}

// Persisted to localStorage
localStorage.setItem('auth-storage', JSON.stringify(authState))
```

### Token Refresh Flow

**Automatic Token Refresh on 401**
```typescript
// Axios interceptor in api/axios.ts

// User makes API call with expired token
GET /users/me
Authorization: Bearer <expired_token>

// Backend returns 401

// Interceptor catches 401
↓
Call POST /auth/refresh with refresh_token
↓
Receive new access_token and refresh_token
↓
Update tokens in authStore
↓
Retry original request with new access_token
↓
Return successful response to component
```

---

## Key Features Implementation

### 1. User Registration & Profile Management

**Registration Flow**
```
Frontend Form (Register.tsx)
  ↓ Validates: login, password, security question
  ↓
authAPI.register()
  ↓
POST /auth/register
  ↓
RegisterUseCase
  ├── Check if login exists
  ├── Hash password with bcrypt
  ├── Hash security answer
  ├── Create User entity
  └── Save to database
  ↓
Return user + tokens
  ↓
Auto-login user
  ↓
Navigate to profile completion
```

**Profile Update**
```
Profile Page with 7 Tabs
  ├── General Info (name, rank, position, avatar)
  ├── Certificates (upload/manage certificates)
  ├── Roles & Skills (multi-select assignment)
  ├── Team History (past team memberships)
  ├── Current Team (active team details)
  ├── Competitions (participation history)
  └── Activity Log (audit trail)

Update Flow:
  User edits → PATCH /users/me → UpdateProfileUseCase → Database
```

### 2. Team Management System

**Team Creation**
```
Captain creates team (CreateTeam.tsx)
  ↓ Form: name, description, image, max_members
  ↓
POST /teams
  ↓
CreateTeamUseCase
  ├── Validate user has Captain role
  ├── Create Team entity with captain_id
  ├── Add captain as first TeamMember
  └── Assign Captain role if not already assigned
  ↓
Return new team
```

**Join Request Workflow**
```
User requests to join (TeamDetail.tsx)
  ↓
POST /teams/{id}/join
  ↓
Create TeamJoinRequest (status: pending)
  ↓
Captain views requests (TeamRequests.tsx)
  ↓
Captain approves/rejects
  ↓
PATCH /teams/{team_id}/requests/{request_id}
  ↓
If approved:
  ├── Update request status → approved
  ├── Create TeamMember record
  └── Notify user
If rejected:
  └── Update request status → rejected
```

**Team Member Management**
```
Captain can:
  ├── View all members (GET /teams/{id}/members)
  ├── Remove members (DELETE /teams/{id}/members/{user_id})
  ├── Edit team info (PATCH /teams/{id})
  └── Disband team (DELETE /teams/{id})
```

### 3. Competition Management

**Competition Creation (Moderators Only)**
```
Moderator creates competition (ModeratorCompetitions.tsx)
  ↓
POST /competitions
  ↓
Require role: Moderator
  ↓
Create Competition entity
  ↓
Return new competition
```

**Team Registration for Competition**
```
Captain applies team to competition
  ↓
POST /competitions/{id}/register
  ↓
Validate:
  ├── User is captain of team
  ├── Competition accepting registrations
  └── Team not already registered
  ↓
Create CompetitionRegistration
  ↓
Return confirmation
```

### 4. File Upload System

**Avatar Upload**
```typescript
// Frontend: AvatarUploader.tsx
<FileUploader
  accept="image/*"
  maxSize={5 * 1024 * 1024}  // 5MB
  onUpload={handleAvatarUpload}
/>

// Upload flow
User selects image
  ↓
Validate size/type client-side
  ↓
FormData with file
  ↓
POST /users/me/avatar
  ↓
Backend FileHandler
  ├── Validate file extension
  ├── Validate file size (< 50MB)
  ├── Generate unique filename
  ├── Save to /static/avatars/
  └── Update user.avatar in database
  ↓
Return file URL
```

**Certificate Upload**
```
Supports: PDF, DOCX, JPG, PNG
  ↓
POST /certificates (multipart/form-data)
  ↓
FileHandler saves to /static/certificates/
  ↓
Create Certificate record with file_path
```

### 5. Report Generation

**Captain Reports (DOCX)**
```
Captain submits report for competition
  ↓
POST /reports
  {
    competition_id: 1,
    team_id: 2,
    content: "Team participated in...",
    achievements: "1st place in category X"
  }
  ↓
Create CaptainReport record
  ↓
Moderator views (ModeratorReports.tsx)
  ↓
Moderator generates .docx
  ↓
POST /moderator/reports/generate/{report_id}
  ↓
ReportGenerator (python-docx)
  ├── Create Document
  ├── Add title, metadata
  ├── Format content
  ├── Save to /static/reports/
  └── Create ModeratorReport record
  ↓
Return download URL
```

### 6. Role-Based Access Control

**Role Assignment**
```
Moderator assigns role to user
  ↓
POST /moderator/users/{user_id}/roles
  { role_id: 2 }  // Captain role
  ↓
Create UserRole record
  ↓
User gains new permissions
```

**Authorization Checks**
```python
# Backend endpoint
@router.post("/teams")
async def create_team(
    data: CreateTeamRequest,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("Captain", "Moderator"))
):
    # Only Captains and Moderators can create teams
    ...
```

```typescript
// Frontend route
<RoleProtectedRoute allowedRoles={['Moderator']}>
  <ModeratorDashboard />
</RoleProtectedRoute>
```

### 7. Search & Filtering

**User Search**
```
GET /users?search=john&study_group=621&rank=Major
  ↓
UserRepository.search()
  ├── Filter by search term (name, login)
  ├── Filter by study_group
  └── Filter by rank
  ↓
Return paginated results
```

**Team Filtering**
```typescript
// Frontend filtering
const filteredTeams = teams.filter(team => {
  const matchesSearch = team.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase())

  const matchesCaptain = !captainFilter ||
    team.captain.full_name.includes(captainFilter)

  return matchesSearch && matchesCaptain
})
```

### 8. Activity Logging

**Automatic Activity Tracking**
```python
# After any significant action
await user_repo.log_activity(
    user_id=current_user.id,
    action="create_team",
    details={
        "team_id": team.id,
        "team_name": team.name,
        "timestamp": datetime.utcnow()
    }
)
```

**Activity Types**
- login
- logout
- update_profile
- create_team
- join_team
- leave_team
- apply_competition
- upload_certificate
- submit_report

---

## Security Implementation

### 1. Password Security

**Hashing with bcrypt**
```python
# app/infrastructure/security/password.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed: str) -> bool:
    return pwd_context.verify(plain_password, hashed)
```

**Security Questions**
```python
# Hash security answers same way as passwords
security_answer_hash = hash_password(answer.lower().strip())

# Store in user.security_answer_hash
# Verify on password recovery
```

### 2. JWT Authentication

**Token Creation**
```python
# app/infrastructure/security/jwt.py
from jose import jwt
from datetime import datetime, timedelta

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**Token Validation**
```python
def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Token Refresh Endpoint**
```python
@router.post("/auth/refresh")
async def refresh_tokens(data: RefreshRequest):
    # Decode refresh token
    payload = decode_token(data.refresh_token)

    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(400, "Invalid token type")

    # Get user
    user_id = int(payload["sub"])
    user = await user_repo.get_by_id(user_id)

    # Generate new tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }
```

### 3. Role-Based Authorization

**Permission Decorator**
```python
# app/infrastructure/security/permissions.py
def require_role(*allowed_roles: str):
    async def role_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        user_roles = await db.execute(
            select(Role)
            .join(UserRole)
            .where(UserRole.user_id == current_user.id)
        )
        user_role_names = {role.name for role in user_roles.scalars()}

        if not any(role in user_role_names for role in allowed_roles):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )

        return current_user

    return Depends(role_checker)
```

**Usage in Endpoints**
```python
@router.post("/competitions")
async def create_competition(
    data: CreateCompetitionRequest,
    current_user: User = Depends(require_role("Moderator"))
):
    # Only moderators can create competitions
    ...
```

### 4. CORS Configuration

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # From environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. File Upload Security

**Validation**
```python
# app/infrastructure/storage/file_handler.py
ALLOWED_EXTENSIONS = {
    'avatar': {'.jpg', '.jpeg', '.png', '.gif'},
    'certificate': {'.pdf', '.docx', '.jpg', '.jpeg', '.png'},
    'team_image': {'.jpg', '.jpeg', '.png'},
    'competition_image': {'.jpg', '.jpeg', '.png'}
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

async def save_file(file: UploadFile, category: str) -> str:
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS[category]:
        raise ValueError(f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS[category]}")

    # Validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File too large. Max: {MAX_FILE_SIZE} bytes")

    # Generate unique filename
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = f"static/{category}/{unique_name}"

    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    return file_path
```

### 6. SQL Injection Prevention

SQLAlchemy's ORM uses parameterized queries:
```python
# SAFE - parameterized
query = select(User).where(User.login == login_input)

# NEVER do this (vulnerable to SQL injection)
# query = text(f"SELECT * FROM users WHERE login = '{login_input}'")
```

### 7. System User Protection

```python
# app/infrastructure/security/system_user_protection.py
SYSTEM_USER_ID = 1

async def prevent_system_user_modification(user_id: int):
    if user_id == SYSTEM_USER_ID:
        raise HTTPException(
            status_code=403,
            detail="Cannot modify system user"
        )
```

---

## Development & Deployment

### Local Development Setup

**1. Clone Repository**
```bash
git clone <repository-url>
cd VKA_Hub
```

**2. Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.template .env

# Edit .env with your settings:
# DATABASE_URL=postgresql+asyncpg://user:password@localhost/vkahub
# SECRET_KEY=your-secret-key
# JWT_ALGORITHM=HS256

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev  # Runs on http://localhost:5173
```

### Docker Development

**Start All Services**
```bash
docker-compose up --build
```

**Services Running:**
- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- Adminer (DB Admin): `http://localhost:8080`

**Docker Compose Structure**
```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: vkahub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db/vkahub
      SECRET_KEY: dev-secret-key
    volumes:
      - ./backend:/app
      - static_files:/app/static
    ports:
      - "8000:8000"
    command: >
      sh -c "
        alembic upgrade head &&
        uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
      "

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://localhost:8000
    ports:
      - "3000:80"

  adminer:
    image: adminer
    ports:
      - "8080:8080"
```

### Database Migrations

**Create New Migration**
```bash
cd backend
alembic revision -m "description of changes"
```

**Apply Migrations**
```bash
alembic upgrade head
```

**Rollback Migration**
```bash
alembic downgrade -1
```

**Migration File Example**
```python
# alembic/versions/001_initial_schema.py
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('login', sa.String(50), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        # ... more columns
    )

def downgrade():
    op.drop_table('users')
```

### Testing

**Backend Tests**
```bash
cd backend
pytest                    # Run all tests
pytest tests/test_auth.py # Run specific test file
pytest -v                 # Verbose output
pytest --cov              # With coverage report
```

**Frontend Tests**
```bash
cd frontend
npm test                  # Run tests
npm run test:coverage     # With coverage
```

### Production Build

**Frontend Production Build**
```bash
cd frontend
npm run build
# Creates optimized build in /dist
```

**Backend Production**
```bash
# Use production ASGI server
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Environment Variables

**Backend `.env`**
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost/vkahub

# Security
SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=static

# Logging
LOG_LEVEL=INFO
```

**Frontend `.env`**
```env
VITE_API_URL=http://localhost:8000
```

### Deployment Considerations

**Security Checklist**
- [ ] Change SECRET_KEY to strong random value
- [ ] Use HTTPS in production
- [ ] Set strong database password
- [ ] Configure proper CORS origins
- [ ] Enable database backups
- [ ] Set up logging and monitoring
- [ ] Use environment-specific configs
- [ ] Review file upload limits
- [ ] Enable rate limiting
- [ ] Set up firewall rules

**Performance Optimization**
- [ ] Enable database connection pooling
- [ ] Configure NGINX caching
- [ ] Compress static assets (gzip)
- [ ] Optimize database indexes
- [ ] Use CDN for static files
- [ ] Enable React production build
- [ ] Monitor API response times
- [ ] Set up database query monitoring

---

## Appendix: Common Development Tasks

### Adding a New API Endpoint

**1. Create DTO**
```python
# app/presentation/api/dtos/feature.py
class CreateFeatureRequest(BaseModel):
    name: str
    description: Optional[str]

class FeatureResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
```

**2. Create Use Case**
```python
# app/use_cases/features/create_feature.py
class CreateFeatureUseCase:
    def __init__(self, feature_repo: FeatureRepository):
        self.feature_repo = feature_repo

    async def execute(self, name: str, description: str) -> Feature:
        feature = Feature(name=name, description=description)
        return await self.feature_repo.create(feature)
```

**3. Create Router**
```python
# app/presentation/api/routers/features.py
router = APIRouter(prefix="/features", tags=["features"])

@router.post("", response_model=FeatureResponse)
async def create_feature(
    data: CreateFeatureRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = FeatureRepositoryImpl(db)
    use_case = CreateFeatureUseCase(repo)
    feature = await use_case.execute(**data.dict())
    return FeatureResponse.from_orm(feature)
```

**4. Register Router**
```python
# app/main.py
from app.presentation.api.routers import features

app.include_router(features.router)
```

### Adding a New Frontend Page

**1. Create Page Component**
```typescript
// src/pages/Features/FeaturesList.tsx
export function FeaturesList() {
  const [features, setFeatures] = useState<Feature[]>([])

  useEffect(() => {
    loadFeatures()
  }, [])

  const loadFeatures = async () => {
    const data = await featuresAPI.getAll()
    setFeatures(data)
  }

  return (
    <MainLayout>
      <Title>Features</Title>
      {/* ... render features */}
    </MainLayout>
  )
}
```

**2. Add API Functions**
```typescript
// src/api/features.ts
export const featuresAPI = {
  getAll: async () => {
    const response = await api.get('/features')
    return response.data
  },

  create: async (data: CreateFeatureData) => {
    const response = await api.post('/features', data)
    return response.data
  }
}
```

**3. Add Route**
```typescript
// src/routes/index.tsx
import { FeaturesList } from '@/pages/Features/FeaturesList'

// In routes array:
{
  path: '/features',
  element: <ProtectedRoute><FeaturesList /></ProtectedRoute>
}
```

**4. Add Types**
```typescript
// src/types/feature.ts
export interface Feature {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface CreateFeatureData {
  name: string
  description?: string
}
```

---

## Summary

This documentation provides a complete overview of the VKA Hub project architecture, implementation details, and development workflows. The project demonstrates:

- **Clean Architecture** with clear separation of concerns
- **Modern Tech Stack** (FastAPI, React, TypeScript, PostgreSQL)
- **Security Best Practices** (JWT auth, password hashing, RBAC)
- **Async-First Design** for performance
- **Comprehensive Features** for competition and team management
- **Production-Ready** with Docker containerization and proper configuration management

Use this documentation to understand the codebase structure, add new features, debug issues, or onboard new developers to the project.
