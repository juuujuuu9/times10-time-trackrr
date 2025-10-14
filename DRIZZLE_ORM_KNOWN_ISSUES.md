# Drizzle ORM Known Issues & Workarounds

## 🚨 Critical Issue: Field Mapping in Production

### Issue Description
Drizzle ORM has inconsistent field mapping behavior between development and production environments, particularly with boolean fields that map to snake_case database columns.

### Symptoms
- ✅ **Development**: Works perfectly with Drizzle ORM field mapping
- ❌ **Production**: Fails with "Failed query" errors on INSERT operations
- 🔍 **Root Cause**: Drizzle ORM field mapping (`isSystem` → `is_system`) fails in production

### Affected Operations
- Task creation with `isSystem` field
- Project creation with `isSystem` field  
- Any Drizzle operation using field mapping in production

### Error Pattern
```
Failed query: INSERT INTO "tasks" ("id", "project_id", "name", "description", "status", "priority", "due_date", "archived", "is_system", "created_at", "updated_at") VALUES (default, $1, $2, $3, default, default, default, default, $4, default, default) RETURNING ...
```

## 🛠️ Workaround: Raw SQL for Critical Operations

### When to Use Raw SQL
- ✅ **Always use raw SQL** for operations that must work in production
- ✅ **Use raw SQL** for boolean field mappings (`isSystem` → `is_system`)
- ✅ **Use raw SQL** for any field that maps to snake_case database columns
- ⚠️ **Keep Drizzle ORM** for simple operations without field mapping

### Implementation Pattern

#### ❌ Problematic Drizzle ORM Usage
```typescript
// DON'T DO THIS - Causes production failures
const task = await db.insert(tasks).values({
  name: 'General',
  projectId: projectId,
  isSystem: true, // Field mapping fails in production
}).returning();
```

#### ✅ Working Raw SQL Solution
```typescript
// DO THIS - Works reliably in all environments
import { sql } from 'drizzle-orm';

const taskResult = await db.execute(sql`
  INSERT INTO tasks (project_id, name, description, is_system) 
  VALUES (${projectId}, ${name}, ${description}, ${isSystem}) 
  RETURNING id, project_id, name, description, is_system
`);
```

### Required Imports
```typescript
import { sql } from 'drizzle-orm';
```

## 📋 Affected Features Audit

### High Priority (Must Fix)
- [x] **Client Creation** - Task creation with `isSystem` field
- [ ] **Project Creation** - Any project operations with `isSystem` field
- [ ] **Task Management** - Task creation/updates with field mapping
- [ ] **Collaborative Features** - Any operations using field mapping

### Medium Priority (Should Fix)
- [ ] **User Management** - Any user operations with field mapping
- [ ] **Time Entries** - Any time entry operations with field mapping
- [ ] **Notifications** - Any notification operations with field mapping

### Low Priority (Monitor)
- [ ] **Simple CRUD** - Operations without field mapping (usually work)
- [ ] **Read Operations** - SELECT queries (usually work)

## 🔧 Implementation Guidelines

### Rule: RULE-022 - Drizzle ORM Production Safety
**Severity:** Error  
**Applies to:** All production database operations

#### Requirements
1. **Always use raw SQL** for operations with field mapping
2. **Test in production** before deploying Drizzle ORM changes
3. **Document field mappings** that cause issues
4. **Use raw SQL** for any boolean field operations in production

#### Implementation Checklist
- [ ] Identify operations using field mapping
- [ ] Replace with raw SQL using `db.execute(sql`...`)`
- [ ] Test in production environment
- [ ] Document the change and reasoning
- [ ] Update this file with new findings

### Code Review Checklist
When reviewing code that uses Drizzle ORM:
- [ ] Does it use field mapping? → Use raw SQL
- [ ] Is it a critical production operation? → Use raw SQL  
- [ ] Does it involve boolean fields? → Use raw SQL
- [ ] Is it a simple SELECT without field mapping? → Drizzle OK

## 🧪 Testing Strategy

### Development Testing
1. Test with Drizzle ORM in development
2. Verify field mapping works locally
3. **Don't assume production will work the same way**

### Production Testing
1. **Always test critical operations in production**
2. Use raw SQL for any operation that must work
3. Monitor for "Failed query" errors
4. Have rollback plan ready

### Debugging Production Issues
1. Check for "Failed query" errors in logs
2. Look for field mapping operations
3. Replace with raw SQL immediately
4. Document the issue in this file

## 📚 Examples

### Task Creation (Fixed)
```typescript
// Before (BROKEN in production)
const task = await db.insert(tasks).values({
  name: 'General',
  projectId: projectId,
  isSystem: true,
}).returning();

// After (WORKS in production)
const taskResult = await db.execute(sql`
  INSERT INTO tasks (project_id, name, description, is_system) 
  VALUES (${projectId}, 'General', ${description}, true) 
  RETURNING id, project_id, name, description, is_system
`);
```

### Project Creation (Should Fix)
```typescript
// Before (POTENTIALLY BROKEN)
const project = await db.insert(projects).values({
  name: projectName,
  clientId: clientId,
  isSystem: false,
}).returning();

// After (PRODUCTION SAFE)
const projectResult = await db.execute(sql`
  INSERT INTO projects (name, client_id, is_system) 
  VALUES (${projectName}, ${clientId}, false) 
  RETURNING id, name, client_id, is_system
`);
```

## 🚀 Future Prevention

### Development Guidelines
1. **Always use raw SQL** for production-critical operations
2. **Test in production** before deploying Drizzle changes
3. **Document field mappings** that cause issues
4. **Prefer raw SQL** over Drizzle ORM for complex operations

### Code Standards
- Use raw SQL for any operation with field mapping
- Use raw SQL for any boolean field operations
- Use raw SQL for any production-critical database operations
- Only use Drizzle ORM for simple operations without field mapping

### Monitoring
- Watch for "Failed query" errors in production logs
- Monitor database operation success rates
- Have rollback plans for Drizzle ORM changes
- Document all field mapping issues

---

**Last Updated:** 2025-01-11  
**Status:** Active Issue - Workaround Implemented  
**Priority:** Critical - Affects Production Operations
