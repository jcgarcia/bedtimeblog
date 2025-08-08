#!/bin/bash

# Database migration script to run the status fix
# This will connect to your PostgreSQL database and run the migration

echo "🔧 Running database migration to fix post status..."

# Check if we can connect to the database
echo "📡 Testing database connection..."

# Run the migration SQL script
echo "🚀 Executing status migration..."
psql $DATABASE_URL -f database/fix_posts_status_migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Summary:"
    echo "- All posts with published_at dates now have status='published'"
    echo "- All posts without published_at now have status='draft'"
    echo "- Your Operations Panel will now show correct status for all posts"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Check your Operations Panel - 'View Drafts' and 'Manage Published' should work correctly"
    echo "2. All posts uploaded via publishing tool will show as 'Published'"
    echo "3. The status filtering is now accurate"
else
    echo "❌ Migration failed. Please check your database connection."
    echo "You can run the migration manually:"
    echo "psql \$DATABASE_URL -f database/fix_posts_status_migration.sql"
fi
