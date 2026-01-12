#!/bin/bash

set -e

echo "🔄 Waiting for database to be ready..."
until pg_isready -h postgres -U ${POSTGRES_USER:-vkahub}; do
    echo "⏳ Database is unavailable - sleeping"
    sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running database migrations..."
alembic upgrade head

echo "✅ Migrations complete!"

# Determine reload flag based on environment
if [ "${APP_ENV:-prod}" = "dev" ]; then
    echo "🔧 Starting application in DEV mode (with auto-reload)..."
    RELOAD_FLAG="--reload"
else
    echo "🚀 Starting application in PROD mode..."
    RELOAD_FLAG=""
fi

cd /app
uvicorn app.main:app --host 0.0.0.0 --port 8000 $RELOAD_FLAG

exec "$@"
