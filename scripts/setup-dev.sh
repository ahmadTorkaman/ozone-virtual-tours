#!/bin/bash
# ===========================================
# Ozone Virtual Tours - Development Setup
# ===========================================
# Usage: ./scripts/setup-dev.sh

set -e

echo "🛠️  Setting up development environment..."

# Navigate to project root
cd "$(dirname "$0")/.."

# -------------------------------------------
# Create .env if it doesn't exist
# -------------------------------------------
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "   ⚠️  Please review and update .env with your settings"
fi

if [ ! -f "server/.env" ]; then
    echo "📝 Creating server/.env from server/.env.example..."
    cp server/.env.example server/.env
fi

# -------------------------------------------
# Start PostgreSQL only
# -------------------------------------------
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
until docker-compose exec -T postgres pg_isready -U ozone -d ozone_tours > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "   ✅ PostgreSQL is ready!"

# -------------------------------------------
# Install dependencies
# -------------------------------------------
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# -------------------------------------------
# Setup database
# -------------------------------------------
echo "📊 Setting up database..."
cd server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

# Run seed
npm run db:seed

cd ..

# -------------------------------------------
# Summary
# -------------------------------------------
echo ""
echo "✅ Development setup complete!"
echo ""
echo "📋 To start development:"
echo "   Terminal 1 (Backend):  cd server && npm run dev"
echo "   Terminal 2 (Frontend): cd client && npm run dev"
echo ""
echo "   Or with Docker:        docker-compose up"
echo ""
echo "🌐 URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   API:       http://localhost:3001"
echo "   DB Studio: cd server && npx prisma studio"
