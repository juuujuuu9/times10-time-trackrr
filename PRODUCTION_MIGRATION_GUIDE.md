# Production Migration Guide

## Overview
This guide ensures a seamless migration from split clients to proper client/project structure with zero downtime and no user confusion.

## Pre-Migration Checklist

### 1. Backup Production Database
```bash
# Create a full backup before starting
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test Migration Script Locally
```bash
# Test the migration in dry-run mode
npm run production-migration

# If everything looks good, run it for real
npm run production-migration -- --execute
```

## Production Migration Steps

### Step 1: Deploy Code Changes
Deploy the updated codebase with:
- New client creation flow (requires first project)
- Project-first time entry selection
- Updated admin interface
- Migration scripts

### Step 2: Run Migration Script
```bash
# First, run in dry-run mode to see what will happen
npm run production-migration

# If everything looks correct, execute the migration
npm run production-migration -- --execute
```

### Step 3: Verify Migration
```bash
# Ensure all users have access to all tasks
npm run ensure-general-assignments

# Check the results
npm run production-migration -- --execute
```

## What the Migration Does

### ✅ Safe Operations
- **Non-destructive**: Archives old clients instead of deleting
- **Idempotent**: Safe to run multiple times
- **Comprehensive**: Handles all edge cases

### 📋 Migration Steps
1. **Process Split Clients**: 
   - Finds clients named like "Brand - Project"
   - Creates canonical "Brand" clients
   - Creates "Project" projects under the brand
   - Moves time entries to new structure
   - Archives old split clients

2. **Ensure Appropriate Tasks**:
   - Creates tasks for non-Time Tracking projects only:
     - "Time Tracking" projects → Skipped (not shown in time tracker)
     - Other projects → task name = project name
   - Assigns all tasks to ALL active users
   - Handles missing tasks automatically

3. **Update Existing Tasks**:
   - Updates existing tasks to follow new naming convention
   - "Time Tracking" projects are skipped entirely
   - Specific projects show project name as task name

4. **Clean Up Orphaned Data**:
   - Archives projects under archived clients
   - Archives tasks under archived projects
   - Maintains data integrity

5. **Verify User Access**:
   - Ensures ALL users have access to ALL tasks
   - No manual assignment needed

## Post-Migration Verification

### Check Admin Interface
- ✅ "Active Projects" counter shows correct count
- ✅ All clients show their projects
- ✅ No orphaned data visible

### Check User Experience
- ✅ All users can see relevant projects in time entry (Time Tracking projects hidden)
- ✅ Project selection works seamlessly
- ✅ Clean display: Client → Project (no redundant labels)
- ✅ Time Tracking projects are hidden from time tracker interface

### Database Verification
```sql
-- Check active projects count
SELECT COUNT(*) FROM projects WHERE archived = false;

-- Check General tasks count
SELECT COUNT(*) FROM tasks WHERE name = 'General' AND archived = false;

-- Check user assignments
SELECT 
  u.name as user_name,
  COUNT(ta.task_id) as assigned_tasks
FROM users u
LEFT JOIN task_assignments ta ON u.id = ta.user_id
LEFT JOIN tasks t ON ta.task_id = t.id AND t.name = 'General' AND t.archived = false
WHERE u.status = 'active'
GROUP BY u.id, u.name;
```

## Rollback Plan (if needed)

If issues arise:
1. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Revert code deployment** to previous version

3. **Investigate issues** and re-run migration after fixes

## Key Benefits

### For Admins
- ✅ Simplified workflow: Create client → Project is required
- ✅ No manual task management needed
- ✅ Clean data structure
- ✅ Accurate project counts

### For Users
- ✅ Seamless time tracking experience
- ✅ All projects accessible to all users
- ✅ No confusion about task selection
- ✅ Consistent interface

### For Production
- ✅ Zero downtime migration
- ✅ No data loss
- ✅ Automatic user access
- ✅ Clean, maintainable structure

## Scripts Available

- `npm run production-migration` - Main migration script
- `npm run ensure-general-assignments` - Fix user task assignments
- `npm run migrate:split-clients` - Original split client migration

## Support

If you encounter any issues:
1. Check the migration logs for specific errors
2. Verify database connectivity
3. Ensure all environment variables are set
4. Run verification scripts to check data integrity

The migration is designed to be safe and comprehensive, handling all edge cases automatically.
