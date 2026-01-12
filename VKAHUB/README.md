# VKA HUB - Платформа управления соревнованиями

Комплексная платформа для управления командами, соревнованиями, сертификатами и профилями пользователей с контролем доступа на основе ролей.

---

## 🚀 Быстрый старт

### Требования
- **Docker Desktop** (включает Docker Compose)
- **Git**

### Запуск (2 команды)

```bash
git clone <repository-url>
cd VKAHUB
make dev    # Режим разработки с автоперезагрузкой
```

**Готово!** Откройте в браузере:
- Frontend: http://localhost:3001 (DEV режим)
- Backend API: http://localhost:8000
- Документация API: http://localhost:8000/docs

---

## 📝 Ежедневное использование

```bash
# Запуск (режим разработки, рекомендуется)
make dev

# Запуск (продакшн режим)
make prod-up

# Остановка
make dev-down      # или make prod-down

# Просмотр логов
make logs

# Перезапуск
make restart

# Все команды
make help
```

📖 **Полная документация:** см. [RUNBOOK_RU.md](./RUNBOOK_RU.md)

---

## 🌐 Service URLs

| Service | DEV режим | PROD режим | Hot Reload |
|---------|-----------|------------|------------|
| **Frontend** | http://localhost:3001 | http://localhost:3000 | ✅ Yes (DEV) |
| **Backend** | http://localhost:8000 | http://localhost:8000 | ✅ Yes (DEV) |
| **API Docs** | http://localhost:8000/docs | http://localhost:8000/docs | N/A |
| **DB Admin** | http://localhost:8080 | http://localhost:8080 | N/A |

---

## 🔥 Hot Reload

**Frontend** (React + Vite):
- Edit any file in `frontend/src/**/*`
- Browser auto-refreshes within 1-2 seconds

**Backend** (FastAPI + Uvicorn):
- Edit any file in `backend/app/**/*`
- Server auto-restarts within 1-2 seconds

**No rebuilds needed during development!**

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL 15** - Database
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (with hot reload)
- **Mantine UI** - Component library
- **Zustand** - State management
- **React Query** - Server state management
- **React Router** - Routing

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Adminer** - Database admin UI

---

## 📦 Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control (User, Captain, Moderator)
- ✅ User profiles with 7 tabs
- ✅ Team management (creation, join requests, captain control)
- ✅ Competition system (registration, team members)
- ✅ Certificate management
- ✅ Moderator dashboard
- ✅ Report generation (.docx)
- ✅ File uploads (avatars, images, documents)
- ✅ Activity logging
- ✅ Feedback system (user complaints, platform feedback)

---

## 🛠️ Common Tasks

### Database

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Check migration status
docker compose exec backend alembic current

# Create new migration
docker compose exec backend alembic revision -m "description"

# PostgreSQL shell
docker compose exec postgres psql -U vkahub

# Or use Adminer at http://localhost:8080
# Server: postgres | User: vkahub | Pass: vkahub_password | DB: vkahub
```

### Running Tests

```bash
# Backend tests
docker compose exec backend pytest

# Frontend tests
docker compose exec frontend npm test
```

### Accessing Containers

```bash
# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"

**Solution**: Start Docker Desktop
```bash
# macOS: Open Docker Desktop from Applications
# Linux: sudo systemctl start docker
# Windows: Start Docker Desktop from Start Menu
```

### "Port already in use"

**Solution**: Find and kill the process
```bash
lsof -i :5173  # or :8000, :5432, :8080
kill -9 <PID>

# Or stop old containers
docker compose down
```

### Changes not appearing?

**Solution**: Check you're in the right place
```bash
# Make sure you see hot reload in logs
docker compose logs -f frontend
docker compose logs -f backend

# Try hard refresh in browser (Cmd+Shift+R)

# Restart if needed
docker compose restart frontend
docker compose restart backend
```

### Database errors?

**Solution**: Restart database or reset
```bash
# Restart database
docker compose restart postgres

# Run migrations
docker compose exec backend alembic upgrade head

# Nuclear option (DELETES ALL DATA)
docker compose down -v
./start.sh
```

### Frontend shows blank page?

**Solution**: Check logs and port
```bash
# Check logs for errors
docker compose logs frontend

# Restart frontend
docker compose restart frontend

# Make sure you're on http://localhost:5173 (not 3000!)
```

---

## 📂 Project Structure

```
VKAHUB/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── domain/             # Models and repositories
│   │   ├── use_cases/          # Business logic
│   │   ├── infrastructure/     # DB, security, storage
│   │   └── presentation/       # API endpoints, DTOs
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Tests
│   ├── Dockerfile              # Backend container
│   └── .env                    # Config (auto-created)
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── api/                # API clients
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── store/              # Zustand state
│   │   └── types/              # TypeScript types
│   ├── Dockerfile              # Frontend container
│   └── .env                    # Config (auto-created)
│
├── docker-compose.yml          # Service configuration
├── start.sh                    # 🚀 Start everything
└── stop.sh                     # 🛑 Stop everything
```

---

## ⚙️ Environment Variables

Auto-created from templates on first run. Edit if needed:

### backend/.env
```env
DATABASE_URL=postgresql+asyncpg://vkahub:vkahub_password@postgres:5432/vkahub
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### frontend/.env
```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 Database Schema

Key tables:
- **users** - User accounts
- **roles** - Available roles
- **skills** - Available skills
- **teams** - Teams
- **team_members** - Team membership
- **team_join_requests** - Join requests
- **competitions** - Competitions
- **competition_registrations** - Competition registrations
- **certificates** - User certificates
- **user_complaints** - User reports
- **platform_complaints** - Platform feedback
- **moderators** - Moderator assignments
- **logs** - Activity logs

---

## 📝 API Endpoints

Full API documentation: http://localhost:8000/docs

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

#### Users
- `GET /api/users` - List users
- `GET /api/users/{id}` - User details
- `PUT /api/users/{id}/profile` - Update profile

#### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/{id}/join` - Join request

#### Competitions
- `GET /api/competitions` - List competitions
- `POST /api/competitions/{id}/apply` - Apply

#### Feedback
- `POST /api/users/complaints` - Report user
- `POST /api/users/platform-complaints` - Platform feedback

---

## 🎯 Verification Checklist

After running `./start.sh`, verify:

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API docs at http://localhost:8000/docs
- [ ] Can register/login
- [ ] Edit `frontend/src/App.tsx` → Browser refreshes
- [ ] Edit `backend/app/main.py` → Server restarts (check logs)
- [ ] No errors in logs: `docker compose logs -f`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (hot reload shows them instantly!)
4. Run tests: `docker compose exec backend pytest`
5. Create a Pull Request

---

## 📜 License

MIT License

---

## 💬 Support

Questions or issues? Create an issue on GitHub.

---

**Happy coding! 🚀**
