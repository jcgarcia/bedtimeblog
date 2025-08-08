#!/bin/bash

# Quick database status check script
echo "🔍 Checking posts status in database..."
echo ""

# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please set it first:"
    echo "export DATABASE_URL='your-postgresql-url'"
    exit 1
fi

echo "📊 Current posts status distribution:"
psql "$DATABASE_URL" -c "
SELECT 
    COALESCE(status, 'NULL') as status,
    COUNT(*) as count,
    STRING_AGG(SUBSTR(title, 1, 30), ', ') as sample_titles
FROM posts 
GROUP BY status 
ORDER BY count DESC;
"

echo ""
echo "📋 Sample posts with their status:"
psql "$DATABASE_URL" -c "
SELECT 
    id,
    SUBSTR(title, 1, 40) as title,
    COALESCE(status, 'NULL') as status,
    published_at,
    created_at
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;
"

echo ""
echo "🔧 If you see posts with NULL status, run the migration:"
echo "./database/run_migration.sh"
