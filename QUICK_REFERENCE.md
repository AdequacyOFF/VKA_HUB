# VKA HUB - Quick Reference

## 🚀 Start Project

```bash
cd VKAHUB
./start.sh
```

**URLs**: Frontend: http://localhost:5173 | Backend: http://localhost:8000/docs

---

## 🛑 Stop Project

```bash
./stop.sh
```

---

## 🔄 Restart Services

```bash
# Restart backend
docker compose restart backend

# Restart frontend
docker compose restart frontend

# Restart all
docker compose restart
```

---

## 📋 View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

---

## 🗄️ Database

```bash
# Run migrations
docker compose exec backend alembic upgrade head

# Database shell
docker compose exec postgres psql -U vkahub

# Or use Adminer: http://localhost:8080
```

---

## 🔧 Other Commands

```bash
# Check running services
docker compose ps

# Access backend shell
docker compose exec backend bash

# Access frontend shell
docker compose exec frontend sh

# Fresh restart (deletes data!)
docker compose down -v
./start.sh

# Run backend tests
docker compose exec backend pytest

# Run frontend tests
docker compose exec frontend npm test
```

---

## ⚡ Hot Reload

- Edit `frontend/src/**/*` → Browser auto-refreshes
- Edit `backend/app/**/*` → Server auto-restarts

No rebuilds needed!
