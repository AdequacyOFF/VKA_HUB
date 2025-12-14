#!/bin/bash
# Quick script to rebuild and restart production

echo "🛑 Stopping containers..."
docker-compose down

echo "🔨 Rebuilding frontend..."
docker-compose build frontend

echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "✅ Production rebuilt and started!"
echo ""
echo "📝 Services:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Adminer:  http://localhost:8080"
echo ""
