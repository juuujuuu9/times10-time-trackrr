# API Field Mapping Patterns

## Overview
This guide covers critical patterns for mapping UI field names to database schema field names, preventing silent failures and data inconsistencies.

## Core Problem
UI components often use different field names than the database schema, leading to:
- Silent API failures
- Data not being saved
- Inconsistent behavior across components
- Difficult-to-debug issues

## Field Mapping Rules

### Task/Project ID Mapping
**Problem**: UI refers to selected items as `taskId`, but database uses `projectId` for time entries.

**❌ WRONG Pattern:**
```javascript
// Timer component sending taskId to API
body: JSON.stringify({
  userId: currentUserId,
  taskId: taskId,  // This will fail silently
  date: targetDate.toISOString().split('T')[0],
  duration: serverDurationFormat
})
```

**✅ CORRECT Pattern:**
```javascript
// Timer component maps to correct field name
body: JSON.stringify({
  userId: currentUserId,
  projectId: taskId, // Map UI taskId to DB projectId
  date: targetDate.toISOString().split('T')[0],
  duration: serverDurationFormat
})
```

### API Endpoint Backward Compatibility
**Problem**: Need to support both old and new field names during transitions.

**✅ CORRECT Implementation:**
```typescript
// API endpoint accepts both field names
const { userId, projectId, taskId, date, duration } = body;

// Use projectId if provided, otherwise fall back to taskId
const finalProjectId = projectId || taskId;

if (!userId || !finalProjectId || !date || !duration) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Missing required fields: userId, projectId (or taskId), date, duration'
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Use finalProjectId in all database operations
const existingEntries = await db
  .select()
  .from(timeEntries)
  .where(
    and(
      eq(timeEntries.userId, userId),
      eq(timeEntries.projectId, finalProjectId), // Use mapped field
      // ... other conditions
    )
  );
```

## Schema-First Development

### Always Check Database Schema First
Before implementing any API endpoint or component:

1. **Check the actual database schema**:
   ```bash
   # Look at schema.ts for field names
   grep -r "projectId\|taskId" src/db/schema.ts
   ```

2. **Verify field relationships**:
   ```typescript
   // timeEntries table uses projectId, not taskId
   export const timeEntries = pgTable('time_entries', {
     id: serial('id').primaryKey(),
     projectId: integer('project_id').references(() => projects.id).notNull(),
     // No taskId field exists
   });
   ```

3. **Map UI concepts to DB fields**:
   ```typescript
   // UI concept: "selected task"
   // DB reality: "project_id" in time_entries table
   // Solution: Map taskId (UI) → projectId (DB)
   ```

### Common Field Mappings

| UI Component | UI Field Name | Database Table | DB Field Name | Mapping Required |
|--------------|---------------|----------------|---------------|-------------------|
| Timer | `taskId` | `time_entries` | `project_id` | ✅ Yes |
| Timer | `selectedTask` | `time_entries` | `project_id` | ✅ Yes |
| Projects | `projectId` | `time_entries` | `project_id` | ❌ No |
| Tasks | `taskId` | `tasks` | `id` | ❌ No |
| Tasks | `taskId` | `time_entries` | `project_id` | ✅ Yes |

## Implementation Patterns

### Component-Level Mapping
```javascript
// In Timer component
const handleDurationEdit = async (taskId, dayOfWeek, newDuration, inputElement) => {
  // Map UI taskId to DB projectId
  const response = await fetch('/api/time-entries/duration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUserId,
      projectId: taskId, // Map taskId → projectId
      date: targetDate.toISOString().split('T')[0],
      duration: serverDurationFormat
    }),
  });
};
```

### API Endpoint Mapping
```typescript
// In API endpoint
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { userId, projectId, taskId, date, duration } = body;

  // Support both field names for backward compatibility
  const finalProjectId = projectId || taskId;
  
  if (!userId || !finalProjectId || !date || !duration) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Missing required fields: userId, projectId (or taskId), date, duration'
    }), { status: 400 });
  }

  // Use mapped field in all database operations
  const existingEntries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.projectId, finalProjectId), // Use mapped field
        // ... other conditions
      )
    );
};
```

## Debugging Field Mapping Issues

### Common Symptoms
- API calls return 200 but data doesn't save
- Database queries return empty results
- UI shows success but changes don't persist
- Silent failures with no error messages

### Debugging Steps
1. **Check API request payload**:
   ```javascript
   console.log('API request body:', JSON.stringify(requestBody));
   ```

2. **Verify database field names**:
   ```bash
   # Check schema for actual field names
   grep -A 10 "timeEntries" src/db/schema.ts
   ```

3. **Test with correct field names**:
   ```javascript
   // Test API with correct field name
   const testResponse = await fetch('/api/time-entries/duration', {
     method: 'POST',
     body: JSON.stringify({
       userId: 1,
       projectId: 123, // Use correct field name
       date: '2024-01-01',
       duration: '2h'
     })
   });
   ```

4. **Add field mapping debugging**:
   ```typescript
   // In API endpoint
   console.log('Received fields:', { projectId, taskId, finalProjectId });
   console.log('Using finalProjectId:', finalProjectId);
   ```

## Prevention Strategies

### 1. Schema Documentation
Always document field mappings in component files:
```javascript
// Timer.tsx
// NOTE: This component uses 'taskId' for UI state, but maps to 'projectId' 
// in API calls because the database schema uses project_id for time entries.
// See: src/db/schema.ts - timeEntries table
```

### 2. Type Safety
Use TypeScript interfaces to enforce correct field names:
```typescript
interface DurationEditRequest {
  userId: number;
  projectId: number; // Enforce correct field name
  date: string;
  duration: string;
}
```

### 3. API Validation
Add validation to catch field mapping issues:
```typescript
// Validate that required fields are present
if (!projectId && !taskId) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Either projectId or taskId must be provided'
  }), { status: 400 });
}
```

### 4. Database Query Verification
Always verify database queries use correct field names:
```typescript
// ❌ WRONG - using non-existent field
eq(timeEntries.taskId, taskId)

// ✅ CORRECT - using actual schema field
eq(timeEntries.projectId, projectId)
```

## Testing Field Mappings

### Unit Tests
```javascript
// Test that field mapping works correctly
describe('Duration Edit API', () => {
  it('should accept projectId field', async () => {
    const response = await fetch('/api/time-entries/duration', {
      method: 'POST',
      body: JSON.stringify({
        userId: 1,
        projectId: 123, // Correct field name
        date: '2024-01-01',
        duration: '2h'
      })
    });
    expect(response.status).toBe(200);
  });

  it('should accept taskId field for backward compatibility', async () => {
    const response = await fetch('/api/time-entries/duration', {
      method: 'POST',
      body: JSON.stringify({
        userId: 1,
        taskId: 123, // Legacy field name
        date: '2024-01-01',
        duration: '2h'
      })
    });
    expect(response.status).toBe(200);
  });
});
```

### Integration Tests
```javascript
// Test complete flow from UI to database
describe('Timer Duration Editing', () => {
  it('should update duration and refresh daily totals', async () => {
    // 1. Edit duration in UI
    const input = document.querySelector('[data-task-id="123"]');
    input.value = '3h';
    input.dispatchEvent(new Event('blur'));

    // 2. Verify API call uses correct field name
    expect(mockFetch).toHaveBeenCalledWith('/api/time-entries/duration', {
      method: 'POST',
      body: JSON.stringify({
        userId: 1,
        projectId: 123, // Should use projectId, not taskId
        date: '2024-01-01',
        duration: '3h'
      })
    });

    // 3. Verify database was updated
    const entries = await db.select().from(timeEntries).where(eq(timeEntries.projectId, 123));
    expect(entries[0].durationManual).toBe(10800); // 3 hours in seconds
  });
});
```

## Migration Strategies

### Gradual Field Name Migration
1. **Phase 1**: Support both field names in API
2. **Phase 2**: Update components to use correct field names
3. **Phase 3**: Remove support for legacy field names
4. **Phase 4**: Update documentation and tests

### Backward Compatibility
```typescript
// Support both field names during migration
const finalProjectId = projectId || taskId;

// Log usage for monitoring
if (taskId && !projectId) {
  console.warn('Using legacy taskId field. Consider updating to projectId.');
}
```

## Common Pitfalls

### ❌ Don't Do This
```javascript
// Sending wrong field name
body: JSON.stringify({
  taskId: taskId, // Wrong field name for this API
  userId: currentUserId
})

// Not checking schema first
eq(timeEntries.taskId, taskId) // taskId doesn't exist in schema

// Silent failures
const response = await fetch('/api/time-entries/duration', { ... });
// No error handling for field mapping issues
```

### ✅ Do This Instead
```javascript
// Use correct field name
body: JSON.stringify({
  projectId: taskId, // Correct field name
  userId: currentUserId
})

// Check schema first
eq(timeEntries.projectId, projectId) // Correct field name

// Handle mapping errors
if (!response.ok) {
  const error = await response.json();
  console.error('Field mapping error:', error);
  // Show user-friendly error message
}
```

## Summary

Field mapping issues are a common source of silent failures in applications. By following these patterns:

1. **Always check the database schema first**
2. **Map UI field names to DB field names explicitly**
3. **Support backward compatibility during transitions**
4. **Add debugging and validation**
5. **Test field mappings thoroughly**

You can prevent these issues and create more reliable applications.
