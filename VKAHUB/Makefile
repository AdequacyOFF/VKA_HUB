.PHONY: help dev prod-up prod-down restart build-image export-image import-image logs clean

# Default target
help:
	@echo "=========================================="
	@echo "VKA_HUB - Docker Management Commands"
	@echo "=========================================="
	@echo ""
	@echo "DEVELOPMENT MODE (with bind mount + auto-reload):"
	@echo "  make dev              - Start in DEV mode (code changes apply instantly)"
	@echo "  make dev-logs         - View DEV mode logs"
	@echo "  make dev-down         - Stop DEV mode"
	@echo ""
	@echo "PRODUCTION MODE (offline-friendly, no rebuild on restart):"
	@echo "  make prod-up          - Start in PROD mode (no build, no downloads)"
	@echo "  make prod-down        - Stop PROD mode"
	@echo "  make restart          - Restart containers (fast, no rebuild)"
	@echo "  make logs             - View PROD mode logs"
	@echo ""
	@echo "IMAGE MANAGEMENT (for offline deployment):"
	@echo "  make build-image      - Build Docker image (requires internet)"
	@echo "  make export-image     - Export image to tar file"
	@echo "  make import-image     - Import image from tar file (offline)"
	@echo ""
	@echo "UTILITIES:"
	@echo "  make clean            - Remove containers, volumes, and images"
	@echo "  make shell-backend    - Open shell in backend container"
	@echo "  make shell-db         - Open PostgreSQL shell"
	@echo ""

# ============================================================================
# DEVELOPMENT MODE (bind mount + auto-reload)
# ============================================================================

dev:
	@echo "🔧 Starting in DEV mode (with auto-reload)..."
	@echo "📦 Building frontend dev image (if needed)..."
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml build frontend
	@echo "🚀 Starting all services..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo ""
	@echo "✅ DEV mode started!"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:3001 (dev server)"
	@echo "   Adminer:  http://localhost:8080"
	@echo ""
	@echo "Code changes will apply automatically (no restart needed)."

dev-logs:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# ============================================================================
# PRODUCTION MODE (offline-friendly)
# ============================================================================

prod-up:
	@echo "🚀 Starting in PROD mode (no build, no downloads)..."
	docker-compose up -d
	@echo "✅ PROD mode started!"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Adminer:  http://localhost:8080"

prod-down:
	docker-compose down

restart:
	@echo "🔄 Restarting containers (fast, no rebuild)..."
	docker-compose restart
	@echo "✅ Restart complete!"

logs:
	docker-compose logs -f

# ============================================================================
# IMAGE MANAGEMENT (for offline deployment)
# ============================================================================

build-image:
	@echo "🏗️  Building Docker image (requires internet)..."
	docker-compose build --no-cache backend
	@echo "✅ Image built successfully!"
	@echo "   Run 'make export-image' to save it for offline deployment."

export-image:
	@echo "📦 Exporting Docker image to tar file..."
	@mkdir -p ./docker-images
	docker save vkahub-backend:latest -o ./docker-images/vkahub-backend.tar
	docker save postgres:15-alpine -o ./docker-images/postgres-15-alpine.tar
	docker save adminer:latest -o ./docker-images/adminer-latest.tar
	@echo "✅ Images exported to ./docker-images/"
	@ls -lh ./docker-images/
	@echo ""
	@echo "Copy ./docker-images/ to the server and run 'make import-image'"

import-image:
	@echo "📥 Importing Docker images from tar files (offline)..."
	@if [ ! -d ./docker-images ]; then \
		echo "❌ Error: ./docker-images/ directory not found!"; \
		echo "   Copy the exported images to this directory first."; \
		exit 1; \
	fi
	docker load -i ./docker-images/vkahub-backend.tar
	docker load -i ./docker-images/postgres-15-alpine.tar
	docker load -i ./docker-images/adminer-latest.tar
	@echo "✅ Images imported successfully!"
	@echo "   Run 'make prod-up' to start the application."

# ============================================================================
# UTILITIES
# ============================================================================

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	@echo "✅ Cleanup complete!"

shell-backend:
	docker exec -it vkahub_backend /bin/bash

shell-db:
	docker exec -it vkahub_postgres psql -U vkahub -d vkahub

# ============================================================================
# INTERNAL HELPERS
# ============================================================================

# Verify all images are available (used for offline deployments)
verify-offline:
	@echo "🔍 Verifying offline deployment readiness..."
	@docker images | grep -q "vkahub-backend" || (echo "❌ vkahub-backend image missing!" && exit 1)
	@docker images | grep -q "postgres.*15-alpine" || (echo "❌ postgres:15-alpine image missing!" && exit 1)
	@docker images | grep -q "adminer" || (echo "❌ adminer image missing!" && exit 1)
	@echo "✅ All required images are available!"
