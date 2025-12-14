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

echo "🚀 Starting application..."
exec "$@"
