#!/bin/bash

# Simplified Database Synchronization Workflow
# Quick sync from local development to production
# Usage: ./sync-databases.sh [--force]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Database Synchronization Workflow${NC}"
echo "====================================="

# Check for force flag
FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
    echo -e "${YELLOW}⚠️  Force mode enabled - skipping confirmations${NC}"
fi

# Step 1: Quick schema check
echo -e "${YELLOW}🔍 Checking schema differences...${NC}"
node comprehensive-db-audit.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schemas are already in sync!${NC}"
    exit 0
fi

# Step 2: Generate and apply migration
echo -e "${YELLOW}📝 Generating migration...${NC}"
npx drizzle-kit generate

if [ "$FORCE" = false ]; then
    echo -e "${YELLOW}⚠️  This will modify the production database!${NC}"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
fi

# Step 3: Apply to production
echo -e "${YELLOW}🚀 Applying to production...${NC}"
export DATABASE_URL="postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"
npx drizzle-kit push --force

# Step 4: Verify
echo -e "${YELLOW}✅ Verifying deployment...${NC}"
node comprehensive-db-audit.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Database synchronization completed successfully!${NC}"
else
    echo -e "${RED}❌ Verification failed - check the audit results${NC}"
    exit 1
fi
