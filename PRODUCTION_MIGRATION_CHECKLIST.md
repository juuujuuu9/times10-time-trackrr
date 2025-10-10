# 🚀 Production Migration Checklist - Collaborative Features

## ✅ Pre-Migration Verification

### Development Environment Tests
- [x] **Schema Migration**: All 8 collaborative tables created successfully
- [x] **Foreign Keys**: 16 foreign key constraints working properly
- [x] **Indexes**: 8 performance indexes created and optimized
- [x] **Data Operations**: Insert, update, delete operations working
- [x] **Relationships**: All table relationships verified
- [x] **Performance**: Query performance within acceptable limits

### Code Changes Verified
- [x] **Schema Files**: `drizzle/schema.ts`, `src/db/schema.ts` updated
- [x] **Relations**: `drizzle/relations.ts` updated with new relationships
- [x] **Migration Script**: `0013_add_collaborative_features.sql` created
- [x] **No Breaking Changes**: Existing functionality preserved

## 🔧 Production Migration Steps

### Step 1: Pre-Migration Backup
```bash
# Create full database backup
pg_dump $DATABASE_URL > backup_before_collaborative_features_$(date +%Y%m%d_%H%M%S).sql

# Verify backup size
ls -lh backup_before_collaborative_features_*.sql
```

### Step 2: Environment Preparation
```bash
# Set production database URL
export DATABASE_URL="your_production_database_url"

# Verify connection
node -r dotenv/config simple-schema-test.js
```

### Step 3: Execute Migration
```bash
# Option A: Drizzle Push (Recommended)
npm run db:push

# Option B: Direct SQL (Alternative)
psql $DATABASE_URL -f create-collaborative-tables.sql

# Option C: Manual Migration
# Execute contents of drizzle/0013_add_collaborative_features.sql
```

### Step 4: Post-Migration Verification
```bash
# Run comprehensive schema test
node -r dotenv/config simple-schema-test.js

# Verify all tables exist
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('teams', 'team_members', 'task_collaborations', 'task_discussions', 'task_files', 'task_links', 'task_notes', 'notifications');"
```

## 📊 Verification Commands

### Check Table Existence
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'teams', 'team_members', 'task_collaborations', 
  'task_discussions', 'task_files', 'task_links', 
  'task_notes', 'notifications'
);
```

### Verify Foreign Key Constraints
```sql
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN (
  'teams', 'team_members', 'task_collaborations', 
  'task_discussions', 'task_files', 'task_links', 
  'task_notes', 'notifications'
);
```

### Check Indexes
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN (
  'teams', 'team_members', 'task_collaborations', 
  'task_discussions', 'task_files', 'task_links', 
  'task_notes', 'notifications'
);
```

## 🚨 Rollback Procedures

### Emergency Rollback (If Migration Fails)
```sql
-- Drop all new tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS task_notes CASCADE;
DROP TABLE IF EXISTS task_links CASCADE;
DROP TABLE IF EXISTS task_files CASCADE;
DROP TABLE IF EXISTS task_discussions CASCADE;
DROP TABLE IF EXISTS task_collaborations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
```

### Data Integrity Check
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM task_collaborations WHERE task_id NOT IN (SELECT id FROM tasks);
SELECT COUNT(*) FROM task_discussions WHERE task_id NOT IN (SELECT id FROM tasks);
SELECT COUNT(*) FROM team_members WHERE user_id NOT IN (SELECT id FROM users);
```

## 📈 Performance Monitoring

### Monitor Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN (
  'teams', 'team_members', 'task_collaborations', 
  'task_discussions', 'task_files', 'task_links', 
  'task_notes', 'notifications'
);
```

### Monitor Index Usage
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN (
  'teams', 'team_members', 'task_collaborations', 
  'task_discussions', 'task_files', 'task_links', 
  'task_notes', 'notifications'
);
```

## 🎯 Success Criteria

### Technical Success
- [ ] All 8 collaborative tables created
- [ ] All 16 foreign key constraints working
- [ ] All 8 performance indexes created
- [ ] No data loss or corruption
- [ ] Query performance within limits
- [ ] Application functionality preserved

### Business Success
- [ ] Team creation feature working
- [ ] Task collaboration enabled
- [ ] File sharing functional
- [ ] Discussion system operational
- [ ] Notification system active
- [ ] User adoption metrics positive

## 📋 Migration Timeline

### Phase 1: Preparation (Day 1)
- [ ] **Backup Production Database** (30 minutes)
- [ ] **Test Migration on Staging** (1 hour)
- [ ] **Prepare Rollback Procedures** (30 minutes)
- [ ] **Schedule Maintenance Window** (1 hour)

### Phase 2: Migration (Day 2)
- [ ] **Execute Migration** (15 minutes)
- [ ] **Verify Schema** (15 minutes)
- [ ] **Test Basic Operations** (30 minutes)
- [ ] **Monitor Performance** (30 minutes)

### Phase 3: Validation (Day 3)
- [ ] **Run Comprehensive Tests** (1 hour)
- [ ] **Monitor User Activity** (2 hours)
- [ ] **Performance Analysis** (1 hour)
- [ ] **Document Results** (30 minutes)

### Phase 4: Go-Live (Day 4)
- [ ] **Deploy Application Updates** (30 minutes)
- [ ] **Enable Collaborative Features** (15 minutes)
- [ ] **User Training** (1 hour)
- [ ] **Monitor Adoption** (ongoing)

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Foreign Key Constraint Errors
**Solution**: Verify referenced tables exist and have data
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tasks;
```

#### Issue: Index Creation Failures
**Solution**: Check disk space and permissions
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

#### Issue: Permission Errors
**Solution**: Ensure database user has CREATE privileges
```sql
SELECT has_database_privilege(current_user, current_database(), 'CREATE');
```

#### Issue: Timeout During Migration
**Solution**: Run during low-traffic periods, increase timeout settings

## 📊 Post-Migration Monitoring

### Daily Checks (First Week)
- [ ] Monitor table growth
- [ ] Check query performance
- [ ] Verify data integrity
- [ ] Review error logs

### Weekly Checks (First Month)
- [ ] Analyze usage patterns
- [ ] Optimize slow queries
- [ ] Review user feedback
- [ ] Plan feature enhancements

## 🎉 Success Metrics

### Technical Metrics
- Migration completion time: < 30 minutes
- Zero data loss
- All constraints working
- Performance within limits
- No application errors

### Business Metrics
- User adoption rate: > 50% in first month
- Team creation rate: > 10 teams per week
- Task collaboration usage: > 30% of tasks
- File sharing activity: > 100 files per week
- Discussion engagement: > 50% of collaborative tasks

---

## 📞 Emergency Contacts

- **Database Administrator**: [Contact Info]
- **Development Team Lead**: [Contact Info]
- **System Administrator**: [Contact Info]
- **Emergency Rollback**: [Contact Info]

## 📝 Migration Log

```
Migration Date: ___________
Migration Time: ___________
Database: ___________
Migration File: 0013_add_collaborative_features.sql
Status: [SUCCESS/FAILED]
Duration: ___________
Issues: ___________
Rollback Required: [YES/NO]
Next Steps: ___________
```

---

**Note**: This checklist should be completed in order. Each step must be verified before proceeding to the next. Keep detailed logs of all actions taken during the migration process.
