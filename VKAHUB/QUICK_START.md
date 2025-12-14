# VKA Hub - Quick Start

## 🚀 Choose Your Mode

### Development Mode (Recommended for coding)
**Features**: Hot reload, instant changes, no rebuilds, offline support

```bash
./dev.sh
```

OR manually:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**When to use**: Daily development, making code changes

---

### Production Mode
**Features**: Optimized build, nginx serving, production-ready

```bash
./rebuild.sh
```

OR manually:
```bash
docker-compose down
docker-compose build frontend
docker-compose up -d
```

**When to use**: Testing production builds, deploying

---

## 🔧 Common Commands

### Development Mode
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f frontend

# Quick restart (preserves dependencies)
docker-compose -f docker-compose.dev.yml restart frontend

# Stop
docker-compose -f docker-compose.dev.yml down
```

### Production Mode
```bash
# Rebuild after code changes
docker-compose build frontend && docker-compose up -d frontend

# Stop
docker-compose down
```

### Database
```bash
# Run migrations
docker exec -it vkahub_backend alembic upgrade head

# Check migration status
docker exec -it vkahub_backend alembic current

# Create new migration
docker exec -it vkahub_backend alembic revision -m "description"
```

---

## 🌐 Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application |
| Backend | http://localhost:8000 | API server |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| Adminer | http://localhost:8080 | Database management UI |

---

## ⚠️ Troubleshooting

### Changes not appearing?

**If using production mode:**
```bash
# You MUST rebuild:
./rebuild.sh
```

**If using dev mode:**
- Changes should appear automatically
- Check logs: `docker-compose -f docker-compose.dev.yml logs -f frontend`

### Port already in use?
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Frontend shows 404 errors?
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Database connection errors?
```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres
```

---

## 📦 Fresh Install

```bash
# Remove everything and start fresh
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

---

## 💡 Pro Tips

1. **Always use dev mode** for daily development
2. **Commit before rebuilding** to avoid losing changes
3. **Check logs** when things go wrong: `docker-compose logs -f`
4. **Use Adminer** (port 8080) to inspect the database
5. **Read DEV_SETUP.md** for detailed documentation
