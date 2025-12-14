# Development Setup Guide

This guide explains how to run the VKA Hub project in development mode with hot reload.

## Development Mode (Recommended)

Development mode uses `docker-compose.dev.yml` which:
- Runs Vite dev server with hot reload (changes apply instantly)
- Installs dependencies only once (stored in Docker volume)
- Works offline after initial setup
- Faster restarts

### First Time Setup

```bash
# Start all services in dev mode
docker-compose -f docker-compose.dev.yml up -d

# This will:
# 1. Build the containers
# 2. Install npm dependencies (stored in volume)
# 3. Run the dev server
```

### Daily Development

```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend

# Restart just the frontend (fast, preserves node_modules)
docker-compose -f docker-compose.dev.yml restart frontend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Making Changes

**Frontend changes:**
- Just edit files in `frontend/src/`
- Vite will auto-reload in the browser
- No restart needed!

**Backend changes:**
- Edit files in `backend/app/`
- uvicorn auto-reloads
- No restart needed!

### Adding New Dependencies

**Frontend:**
```bash
# If you add packages to package.json, rebuild the container:
docker-compose -f docker-compose.dev.yml build frontend
docker-compose -f docker-compose.dev.yml up -d frontend
```

**Backend:**
```bash
# If you add packages to requirements.txt:
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend
```

### Offline Development

After the first setup, all dependencies are stored in Docker volumes:
- `frontend_node_modules` - npm packages
- You can develop without internet connection!

### Running Database Migrations

```bash
# Enter backend container
docker exec -it vkahub_backend sh

# Run migrations
alembic upgrade head

# Exit
exit
```

### Clean Slate (Delete Everything)

```bash
# Stop and remove all containers, volumes, and networks
docker-compose -f docker-compose.dev.yml down -v

# This will force a fresh install next time
```

## Production Mode

For production builds (serves static files with nginx):

```bash
docker-compose up -d
```

## Accessing Services

- **Frontend (Dev)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Adminer (DB GUI)**: http://localhost:8080

## Troubleshooting

### Frontend not hot reloading

1. Make sure you're using dev mode: `docker-compose -f docker-compose.dev.yml`
2. Check if vite dev server is running: `docker-compose -f docker-compose.dev.yml logs frontend`

### Port already in use

```bash
# Find what's using the port
lsof -i :3000
lsof -i :8000

# Kill the process or use different ports in docker-compose.dev.yml
```

### Dependencies not installing

```bash
# Rebuild the container
docker-compose -f docker-compose.dev.yml build --no-cache frontend
docker-compose -f docker-compose.dev.yml up -d
```

### Can't connect to backend

Make sure `backend` service is running:
```bash
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs backend
```
