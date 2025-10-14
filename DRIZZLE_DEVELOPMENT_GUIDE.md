# Drizzle ORM Development Guide

## 🚨 Critical Rule: Production Safety First

**RULE-022: Drizzle ORM Production Safety**
- **Severity:** Error
- **Applies to:** All database operations
- **Principle:** Production reliability over development convenience

## 🎯 When to Use Raw SQL vs Drizzle ORM

### ✅ Use Raw SQL (Recommended for Production)
- **Any operation with field mapping** (`isSystem` → `is_system`)
- **Boolean field operations** in production
- **Critical production operations** that must work
- **Complex queries** with multiple joins
- **Operations that failed with Drizzle ORM**

### ⚠️ Use Drizzle ORM (Development Only)
- **Simple SELECT queries** without field mapping
- **Development and testing** operations
- **Non-critical operations** that can fail
- **Operations without boolean field mapping**

## 📋 Development Checklist

### Before Writing Database Code
- [ ] Is this a production-critical operation?
- [ ] Does it use field mapping (`isSystem`, `createdAt`, etc.)?
- [ ] Does it involve boolean fields?
- [ ] Will this operation be called in production?

**If ANY answer is YES → Use Raw SQL**

### Code Review Checklist
- [ ] Does the code use `isSystem` field mapping?
- [ ] Is it a production-critical operation?
- [ ] Does it use Drizzle ORM for INSERT/UPDATE with field mapping?
- [ ] Has it been tested in production?

**If ANY answer is YES → Request Raw SQL Implementation**

## 🛠️ Implementation Patterns

### Pattern 1: Project Creation
```typescript
// ❌ DON'T DO THIS - Will fail in production
const project = await db.insert(projects).values({
  name: projectName,
  clientId: clientId,
  isSystem: false, // Field mapping issue
}).returning();

// ✅ DO THIS - Works reliably in production
import { sql } from 'drizzle-orm';

const projectResult = await db.execute(sql`
  INSERT INTO projects (name, client_id, is_system) 
  VALUES (${projectName}, ${clientId}, false) 
  RETURNING id, name, client_id, is_system
`);
const project = projectResult[0];
```

### Pattern 2: Task Creation
```typescript
// ❌ DON'T DO THIS - Will fail in production
const task = await db.insert(tasks).values({
  name: taskName,
  projectId: projectId,
  description: description,
  isSystem: true, // Field mapping issue
}).returning();

// ✅ DO THIS - Works reliably in production
const taskResult = await db.execute(sql`
  INSERT INTO tasks (project_id, name, description, is_system) 
  VALUES (${projectId}, ${taskName}, ${description}, true) 
  RETURNING id, project_id, name, description, is_system
`);
const task = taskResult[0];
```

### Pattern 3: Complex Queries
```typescript
// ❌ DON'T DO THIS - Complex field mapping issues
const results = await db.select({
  id: tasks.id,
  name: tasks.name,
  isSystem: tasks.isSystem, // Field mapping issue
  projectName: projects.name,
}).from(tasks)
.join(projects, eq(tasks.projectId, projects.id))
.where(eq(tasks.isSystem, false));

// ✅ DO THIS - Reliable complex queries
const results = await db.execute(sql`
  SELECT 
    t.id,
    t.name,
    t.is_system,
    p.name as project_name
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  WHERE t.is_system = false
`);
```

## 🔧 Required Imports

### For Raw SQL Operations
```typescript
import { sql } from 'drizzle-orm';
import { db } from '../path/to/db';
```

### For Drizzle ORM Operations (Use Sparingly)
```typescript
import { db } from '../path/to/db';
import { eq, and, or } from 'drizzle-orm';
import { tableName } from '../path/to/schema';
```

## 🧪 Testing Strategy

### Development Testing
1. **Test with Drizzle ORM** in development
2. **Verify field mapping works** locally
3. **Don't assume production will work** the same way

### Production Testing
1. **Always test critical operations** in production
2. **Use raw SQL** for any operation that must work
3. **Monitor for "Failed query" errors**
4. **Have rollback plan ready**

### Validation Steps
1. Test operation in development
2. Test operation in production
3. Monitor production logs
4. Verify database consistency

## 📊 Field Mapping Reference

### Problematic Fields (Use Raw SQL)
- `isSystem` → `is_system`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `projectId` → `project_id`
- `clientId` → `client_id`
- `userId` → `user_id`

### Safe Fields (Drizzle ORM OK)
- `id` (primary keys)
- `name` (varchar fields)
- `description` (text fields)
- `status` (enum fields)
- `archived` (boolean without mapping)

## 🚀 Best Practices

### 1. Default to Raw SQL
- **Start with raw SQL** for any new database operation
- **Only use Drizzle ORM** for simple operations without field mapping
- **Test in production** before deploying Drizzle ORM changes

### 2. Error Handling
```typescript
try {
  const result = await db.execute(sql`...`);
  return result[0];
} catch (error) {
  console.error('Database operation failed:', error);
  throw new Error('Database operation failed');
}
```

### 3. Logging
```typescript
console.log('Executing database operation:', {
  operation: 'create_task',
  projectId: projectId,
  isSystem: true
});

const result = await db.execute(sql`...`);
console.log('Database operation successful:', result[0]);
```

### 4. Documentation
```typescript
/**
 * Creates a system task using raw SQL to avoid Drizzle ORM field mapping issues
 * @param projectId - The project ID
 * @param taskName - The task name
 * @param description - The task description
 * @returns The created task
 */
async function createSystemTask(projectId: number, taskName: string, description: string) {
  // Implementation using raw SQL
}
```

## 🚨 Common Pitfalls

### Pitfall 1: Assuming Development = Production
- **Problem**: Drizzle ORM works in development but fails in production
- **Solution**: Always test in production, use raw SQL for critical operations

### Pitfall 2: Field Mapping Assumptions
- **Problem**: Assuming Drizzle ORM handles field mapping correctly
- **Solution**: Use raw SQL for any operation with field mapping

### Pitfall 3: Ignoring Error Messages
- **Problem**: "Failed query" errors in production logs
- **Solution**: Replace with raw SQL immediately, don't ignore

### Pitfall 4: Over-Engineering
- **Problem**: Complex Drizzle ORM queries that fail in production
- **Solution**: Keep it simple, use raw SQL for complex operations

## 📚 Examples

### Example 1: Client Creation (Fixed)
```typescript
// Before (BROKEN in production)
const client = await db.insert(clients).values({
  name: clientName,
  createdBy: userId,
}).returning();

// After (WORKS in production)
const clientResult = await db.execute(sql`
  INSERT INTO clients (name, created_by) 
  VALUES (${clientName}, ${userId}) 
  RETURNING id, name, created_by
`);
const client = clientResult[0];
```

### Example 2: Project Creation (Fixed)
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
const project = projectResult[0];
```

### Example 3: Task Creation (Fixed)
```typescript
// Before (BROKEN in production)
const task = await db.insert(tasks).values({
  name: taskName,
  projectId: projectId,
  isSystem: true,
}).returning();

// After (WORKS in production)
const taskResult = await db.execute(sql`
  INSERT INTO tasks (project_id, name, is_system) 
  VALUES (${projectId}, ${taskName}, true) 
  RETURNING id, project_id, name, is_system
`);
const task = taskResult[0];
```

## 🎯 Migration Strategy

### For Existing Code
1. **Identify** operations using field mapping
2. **Replace** with raw SQL
3. **Test** in production
4. **Document** the change

### For New Code
1. **Start** with raw SQL
2. **Test** in production
3. **Only use Drizzle ORM** for simple operations
4. **Document** the decision

### For Code Reviews
1. **Check** for field mapping usage
2. **Request** raw SQL for critical operations
3. **Verify** production testing
4. **Document** the review

---

**Last Updated:** 2025-01-11  
**Status:** Active Development Guide  
**Priority:** Critical - Production Safety
