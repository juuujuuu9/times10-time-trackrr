# 🎯 Simplified Collaborative Schema

## Overview

Following **RULE-001 (Simplicity First)**, we've simplified the collaborative features schema by removing unnecessary junction tables and implementing direct relationships.

## ✅ What Was Simplified

### ❌ Removed Over-Engineered Tables:
- `project_teams` - Unnecessary junction table
- `task_collaborations` - Unnecessary junction table

### ✅ Direct Relationships Implemented:
- **Teams** → **Projects** (direct via `project_id`)
- **Tasks** → **Teams** (direct via `team_id`)

## 🗄️ Simplified Schema Structure

### Core Tables

#### 1. **Teams** (`teams`)
```sql
CREATE TABLE "teams" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "description" text,
  "project_id" integer NOT NULL, -- Direct project association
  "created_by" integer NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "archived" boolean DEFAULT false
);
```

#### 2. **Team Members** (`team_members`)
```sql
CREATE TABLE "team_members" (
  "team_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" varchar(50) DEFAULT 'member',
  "joined_at" timestamp DEFAULT now(),
  PRIMARY KEY("team_id", "user_id")
);
```

#### 3. **Tasks** (Enhanced)
```sql
-- Added team_id to existing tasks table
ALTER TABLE "tasks" ADD COLUMN "team_id" integer REFERENCES "teams"("id");
```

## 🔄 Simplified Workflow

### 1. **Create Team for Project**
```typescript
const team = await db.insert(teams).values({
  name: "Frontend Team",
  description: "Handles all frontend development",
  projectId: projectId, // Direct association
  createdBy: userId
});
```

### 2. **Add Users to Team**
```typescript
await db.insert(teamMembers).values([
  { teamId: team.id, userId: user1.id, role: 'lead' },
  { teamId: team.id, userId: user2.id, role: 'member' }
]);
```

### 3. **Create Tasks Under Team**
```typescript
const task = await db.insert(tasks).values({
  name: "Implement login form",
  projectId: projectId,
  teamId: team.id, // Direct team association
  // ... other fields
});
```

### 4. **Assign Team Members to Tasks**
```typescript
// Use existing taskAssignments table
await db.insert(taskAssignments).values([
  { taskId: task.id, userId: user1.id },
  { taskId: task.id, userId: user2.id }
]);
```

## 📊 New Relationship Map

```
Projects
    ↓ (1:many)
Teams (project_id)
    ↓ (1:many)
Tasks (team_id)
    ↓ (many:many via taskAssignments)
Users
```

## 🚀 Benefits of Simplified Schema

### 1. **Simpler Queries**
```sql
-- Get all tasks for a team (no complex joins)
SELECT * FROM tasks WHERE team_id = ?;

-- Get all teams for a project (no complex joins)
SELECT * FROM teams WHERE project_id = ?;
```

### 2. **Better Performance**
- Fewer tables to join
- Direct foreign key relationships
- Simpler indexes

### 3. **Clearer Data Model**
- One team per project (logical constraint)
- Tasks belong to teams directly
- No confusing junction tables

### 4. **Easier Maintenance**
- Fewer tables to manage
- Simpler migrations
- Clear data relationships

## 🔧 Migration Steps

1. **Run Migration**: `drizzle-kit push` or apply `0014_simplify_collaborative_schema.sql`
2. **Update API Code**: Remove references to `projectTeams` and `taskCollaborations`
3. **Update Frontend**: Simplify queries to use direct relationships
4. **Test**: Verify all collaborative features work with simplified schema

## 📝 Key Changes Made

### Schema Changes:
- ✅ Added `project_id` to `teams` table
- ✅ Added `team_id` to `tasks` table  
- ❌ Removed `project_teams` table
- ❌ Removed `task_collaborations` table
- ✅ Updated foreign key constraints with CASCADE
- ✅ Added performance indexes

### Code Changes:
- ✅ Updated `src/db/schema.ts` with simplified relations
- ✅ Removed unnecessary relation definitions
- ✅ Updated foreign key references

## 🎯 Result

The collaborative features now follow a much simpler pattern:

**Project → Team → Tasks → Team Members**

This is exactly what you envisioned - a team is created for a project, users are assigned to the team, and those users can create and work on tasks within that team's scope.

**Rule Impact: RULE-001** - This simplification follows the "Simplicity First" principle by removing unnecessary complexity while maintaining all required functionality.
