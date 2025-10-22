#!/bin/bash

# Database Deployment Workflow
# Generated on 2025-10-22T19:03:55.955Z

echo "🚀 Starting database deployment workflow..."

# Step 1: Backup production database
echo "📦 Creating production backup..."
node backup-production.js

# Step 2: Generate migration from local schema
echo "📝 Generating migration from local schema..."
npx drizzle-kit generate

# Step 3: Apply migration to production
echo "🔄 Applying migration to production..."
npx drizzle-kit push --force

# Step 4: Verify schema synchronization
echo "✅ Verifying schema synchronization..."
node comprehensive-db-audit.js

echo "🎉 Database deployment completed!"
