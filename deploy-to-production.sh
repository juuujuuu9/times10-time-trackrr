#!/bin/bash

# Database Deployment Workflow
# Synchronized deployment from local to production
# Generated: $(date)

set -e  # Exit on any error

echo "🚀 Starting synchronized database deployment workflow..."
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_DB_URL="postgresql://neondb_owner:npg_8hQj7xVaUtiZ@ep-blue-silence-afokhoq0-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
PROD_DB_URL="postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Local DB: ${LOCAL_DB_URL:0:50}..."
echo "   Production DB: ${PROD_DB_URL:0:50}..."
echo "   Backup Directory: $BACKUP_DIR"
echo "   Timestamp: $TIMESTAMP"
echo ""

# Step 1: Pre-deployment audit
echo -e "${YELLOW}🔍 Step 1: Pre-deployment audit...${NC}"
node comprehensive-db-audit.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Pre-deployment audit failed! Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pre-deployment audit passed${NC}"
echo ""

# Step 2: Create production backup
echo -e "${YELLOW}📦 Step 2: Creating production backup...${NC}"
BACKUP_FILE="$BACKUP_DIR/production_backup_${TIMESTAMP}.json"
node -e "
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function backupDatabase() {
  try {
    const sql = neon('$PROD_DB_URL');
    
    // Get all tables
    const tables = await sql\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    \`;
    
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(\`Backing up table: \${tableName}\`);
      
      const data = await sql\`SELECT * FROM \${sql(tableName)}\`;
      backup.tables[tableName] = data;
    }
    
    fs.writeFileSync('$BACKUP_FILE', JSON.stringify(backup, null, 2));
    console.log(\`✅ Backup saved to: $BACKUP_FILE\`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase();
"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backup failed! Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Production backup created: $BACKUP_FILE${NC}"
echo ""

# Step 3: Generate migration from local schema
echo -e "${YELLOW}📝 Step 3: Generating migration from local schema...${NC}"
npx drizzle-kit generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration generation failed! Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration generated successfully${NC}"
echo ""

# Step 4: Apply migration to production
echo -e "${YELLOW}🔄 Step 4: Applying migration to production...${NC}"
echo -e "${YELLOW}⚠️  This will modify the production database!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled by user${NC}"
    exit 0
fi

# Set production database URL for drizzle
export DATABASE_URL="$PROD_DB_URL"
npx drizzle-kit push --force
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration application failed!${NC}"
    echo -e "${YELLOW}💡 You can restore from backup: $BACKUP_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration applied to production${NC}"
echo ""

# Step 5: Post-deployment verification
echo -e "${YELLOW}✅ Step 5: Post-deployment verification...${NC}"
node comprehensive-db-audit.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Post-deployment verification failed!${NC}"
    echo -e "${YELLOW}💡 You can restore from backup: $BACKUP_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Post-deployment verification passed${NC}"
echo ""

# Step 6: Cleanup and summary
echo -e "${GREEN}🎉 Database deployment completed successfully!${NC}"
echo "======================================================"
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "   ✅ Pre-deployment audit passed"
echo "   ✅ Production backup created: $BACKUP_FILE"
echo "   ✅ Migration generated from local schema"
echo "   ✅ Migration applied to production"
echo "   ✅ Post-deployment verification passed"
echo ""
echo -e "${BLUE}📁 Files created:${NC}"
echo "   - Backup: $BACKUP_FILE"
echo "   - Audit results: ./audit-results/"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   1. Test your application with the updated production database"
echo "   2. Monitor for any issues"
echo "   3. Keep the backup file safe for rollback if needed"
echo ""
echo -e "${GREEN}🚀 Deployment workflow completed!${NC}"
