#!/bin/bash
# ===========================================
# Ozone Virtual Tours - Deployment Script
# ===========================================
# Usage: ./scripts/deploy.sh [--build]

set -e

echo "🚀 Starting deployment..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "   Copy .env.example to .env and configure it first."
    exit 1
fi

# Pull latest changes (if this is a git repo)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main || echo "⚠️  Git pull failed, continuing with local code..."
fi

# Build if --build flag is passed or if this is first deployment
if [ "$1" = "--build" ] || [ ! "$(docker images -q ozone-tours-api 2> /dev/null)" ]; then
    echo "🔨 Building Docker images..."
    docker-compose build --no-cache
else
    echo "ℹ️  Using existing images. Pass --build to rebuild."
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 5

# Run migrations
echo "📊 Running database migrations..."
docker-compose exec -T api npx prisma migrate deploy

# Run seed (only seeds if data doesn't exist)
echo "🌱 Running database seed..."
docker-compose exec -T api npm run db:seed

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
docker-compose ps
echo ""
echo "📋 Useful commands:"
echo "   - View logs:     docker-compose logs -f"
echo "   - Stop:          docker-compose down"
echo "   - Restart:       docker-compose restart"
echo "   - Shell (api):   docker-compose exec api sh"
echo "   - DB Studio:     docker-compose exec api npx prisma studio"
