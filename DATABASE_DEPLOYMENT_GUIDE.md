# Database Deployment Guide

This guide explains how to synchronize your local database changes with production without conflicts.

## 🎯 Overview

The database deployment workflow ensures that:
- Local and production schemas stay synchronized
- Changes are safely applied with backups
- Rollback is possible if issues occur
- No data loss during deployment

## 📋 Prerequisites

- Node.js and npm installed
- Drizzle ORM configured
- Database access credentials
- Backup storage location configured

## 🚀 Quick Start

### Option 1: Simple Sync (Recommended for small changes)
```bash
./sync-databases.sh
```

### Option 2: Full Deployment (Recommended for major changes)
```bash
./deploy-to-production.sh
```

## 📊 Database Audit

### Run Comprehensive Audit
```bash
node comprehensive-db-audit.js
```

This will:
- Compare local vs production schemas
- Identify differences and conflicts
- Generate detailed reports
- Provide recommendations

### Audit Results
- **✅ No differences**: Schemas are in sync
- **⚠️ Warnings**: Minor differences that need attention
- **❌ Critical**: Major differences that must be resolved

## 🔄 Deployment Workflows

### 1. Simple Synchronization (`sync-databases.sh`)

**Use when:**
- Making small schema changes
- Adding new columns
- Creating new tables
- Quick deployments

**Process:**
1. Checks for schema differences
2. Generates migration from local schema
3. Applies migration to production
4. Verifies deployment success

**Usage:**
```bash
# Interactive mode (asks for confirmation)
./sync-databases.sh

# Force mode (skips confirmations)
./sync-databases.sh --force
```

### 2. Full Deployment (`deploy-to-production.sh`)

**Use when:**
- Major schema changes
- Production deployments
- When you need full backup and verification

**Process:**
1. Pre-deployment audit
2. Creates production backup
3. Generates migration from local schema
4. Applies migration to production
5. Post-deployment verification
6. Provides rollback information

## 🛠️ Manual Steps

### Step 1: Make Local Changes
```bash
# Edit your schema in src/db/schema.ts
# Add new tables, columns, constraints, etc.
```

### Step 2: Generate Migration
```bash
npx drizzle-kit generate
```

### Step 3: Test Locally
```bash
# Apply migration to local database
npx drizzle-kit push
```

### Step 4: Deploy to Production
```bash
# Set production database URL
export DATABASE_URL="your-production-url"

# Apply migration to production
npx drizzle-kit push --force
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Schema Differences
```bash
# Run audit to identify differences
node comprehensive-db-audit.js

# Review the audit results
cat audit-results/schema-comparison-*.json
```

#### 2. Migration Conflicts
```bash
# Check migration files
ls drizzle/

# Review specific migration
cat drizzle/0001_migration_name.sql
```

#### 3. Production Connection Issues
```bash
# Test production connection
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon('your-production-url');
sql\`SELECT 1\`.then(() => console.log('✅ Connection OK')).catch(console.error);
"
```

### Rollback Procedures

#### Quick Rollback
```bash
# Restore from latest backup
node -e "
const backup = require('./backups/production_backup_TIMESTAMP.json');
// Restore logic here
"
```

#### Manual Rollback
1. Identify the problematic migration
2. Create reverse migration
3. Apply reverse migration to production
4. Verify rollback success

## 📁 File Structure

```
├── comprehensive-db-audit.js     # Main audit script
├── deploy-to-production.sh      # Full deployment workflow
├── sync-databases.sh           # Quick sync workflow
├── audit-results/              # Audit output directory
│   ├── local-schema-*.json     # Local schema snapshots
│   ├── prod-schema-*.json      # Production schema snapshots
│   └── schema-comparison-*.json # Comparison reports
├── backups/                    # Database backups
│   └── production_backup_*.json
└── drizzle/                    # Migration files
    └── *.sql
```

## 🔧 Configuration

### Environment Variables
```bash
# Local database (development)
DATABASE_URL="postgresql://local-connection-string"

# Production database
PROD_DATABASE_URL="postgres://production-connection-string"
```

### Drizzle Configuration
```typescript
// drizzle.config.ts
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## 📋 Best Practices

### 1. Always Audit First
```bash
# Check for differences before making changes
node comprehensive-db-audit.js
```

### 2. Test Locally First
```bash
# Apply changes to local database first
npx drizzle-kit push
```

### 3. Use Backups for Production
```bash
# Always backup before production changes
./deploy-to-production.sh
```

### 4. Verify After Deployment
```bash
# Run audit after deployment
node comprehensive-db-audit.js
```

### 5. Monitor Application
- Check application logs
- Monitor database performance
- Verify all features work correctly

## 🚨 Emergency Procedures

### If Production Database is Corrupted
1. Stop application immediately
2. Restore from latest backup
3. Verify data integrity
4. Restart application
5. Monitor for issues

### If Migration Fails
1. Check migration logs
2. Identify the failing step
3. Create fix migration
4. Apply fix migration
5. Verify success

## 📞 Support

If you encounter issues:
1. Check the audit results in `audit-results/`
2. Review the deployment logs
3. Check database connection strings
4. Verify migration files are correct

## 🔄 Regular Maintenance

### Weekly Tasks
- Run comprehensive audit
- Check for schema drift
- Review backup retention
- Update documentation

### Monthly Tasks
- Full database backup
- Schema optimization review
- Performance analysis
- Security audit

---

**Remember**: Always test changes locally before deploying to production!
