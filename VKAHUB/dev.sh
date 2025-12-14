#!/bin/bash
# Quick script to start development mode

echo "🛑 Stopping production containers..."
docker-compose down

echo "🚀 Starting development mode with hot reload..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Development mode started!"
echo ""
echo "📝 Services:"
echo "   - Frontend: http://localhost:3000 (with hot reload)"
echo "   - Backend:  http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Adminer:  http://localhost:8080"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   - Stop:      docker-compose -f docker-compose.dev.yml down"
echo "   - Restart:   docker-compose -f docker-compose.dev.yml restart frontend"
echo ""
