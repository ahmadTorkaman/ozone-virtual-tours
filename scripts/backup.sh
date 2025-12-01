#!/bin/bash
# ===========================================
# Ozone Virtual Tours - Backup Script
# ===========================================
# Usage: ./scripts/backup.sh [backup_dir]
# Add to crontab for daily backups:
#   0 2 * * * /path/to/ozone-virtual-tours/scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="${1:-/var/backups/ozone-tours}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Navigate to project root
cd "$(dirname "$0")/.."

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting backup at $(date)..."

# -------------------------------------------
# Database Backup
# -------------------------------------------
echo "📊 Backing up database..."
DB_BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql.gz"

docker-compose exec -T postgres pg_dump -U "${POSTGRES_USER:-ozone}" "${POSTGRES_DB:-ozone_tours}" | gzip > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ]; then
    echo "   ✅ Database backup: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
else
    echo "   ❌ Database backup failed!"
    exit 1
fi

# -------------------------------------------
# Uploads Backup
# -------------------------------------------
echo "📁 Backing up uploads..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_$DATE.tar.gz"

# Get the uploads volume path
UPLOADS_VOLUME=$(docker volume inspect ozone-tours-uploads --format '{{.Mountpoint}}' 2>/dev/null || echo "")

if [ -n "$UPLOADS_VOLUME" ] && [ -d "$UPLOADS_VOLUME" ]; then
    tar -czf "$UPLOADS_BACKUP_FILE" -C "$UPLOADS_VOLUME" .
    echo "   ✅ Uploads backup: $UPLOADS_BACKUP_FILE ($(du -h "$UPLOADS_BACKUP_FILE" | cut -f1))"
else
    echo "   ⚠️  Uploads volume not found, skipping..."
fi

# -------------------------------------------
# Cleanup Old Backups
# -------------------------------------------
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete

# -------------------------------------------
# Summary
# -------------------------------------------
echo ""
echo "✅ Backup complete!"
echo "   Location: $BACKUP_DIR"
echo "   Files:"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5
echo ""
echo "💡 To restore database:"
echo "   gunzip -c $DB_BACKUP_FILE | docker-compose exec -T postgres psql -U ozone ozone_tours"
