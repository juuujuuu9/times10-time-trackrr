# System-Generated Tasks Implementation

## Overview

This implementation adds automatic "General" tasks for every client that all users can access for time tracking. These tasks are labeled as "{Client Name} - Time Tracking - General" in logs and reports, but are hidden from regular task/project listings.

## Database Changes

### New Fields Added
- `projects.is_system` (boolean) - Marks system-generated projects
- `tasks.is_system` (boolean) - Marks system-generated tasks

### Migration Applied
- Added `is_system` columns to both `projects` and `tasks` tables with default value `false`

## API Changes

### 1. Client Creation (`/api/admin/clients`)
- **Modified**: Now automatically creates a "Time Tracking" project and "General" task for each new client
- **Behavior**: 
  - Creates project with `name: "Time Tracking"` and `isSystem: true`
  - Creates task with `name: "General"` and `isSystem: true`
  - Assigns the General task to all active users
  - Sets description to `"General time tracking for {Client Name}"`

### 2. Projects API (`/api/admin/projects`)
- **Modified**: Now filters out system-generated projects from regular listings
- **Filter**: `eq(projects.isSystem, false)` added to all queries

### 3. Tasks API (`/api/tasks`)
- **Modified**: Now filters out system-generated tasks from regular listings
- **Filter**: `eq(tasks.isSystem, false)` added to queries

### 4. Project Tasks API (`/api/admin/projects/[id]/tasks`)
- **Modified**: Now filters out system-generated tasks from project task listings
- **Filter**: `eq(tasks.isSystem, false)` added to queries

### 5. New System Tasks API (`/api/system-tasks`)
- **New**: Provides access to system-generated tasks for time tracking
- **Features**:
  - Returns only system-generated tasks assigned to the user
  - Includes `displayName` field with format "{Client Name} - Time Tracking - General"
  - Requires authentication
  - Supports `assignedTo` parameter for admin access

## Component Changes

### Timer Component (`src/components/Timer.tsx`)
- **Modified**: Now loads both regular tasks and system-generated tasks
- **Behavior**:
  - Fetches regular tasks from `/api/tasks`
  - Fetches system tasks from `/api/system-tasks`
  - Combines both lists for display
  - Uses `displayName` for system tasks in dropdown and display
  - Validates selected tasks against both lists

## Scripts and Utilities

### 1. Database Migration Script (`src/scripts/apply-system-fields-migration.ts`)
- **Purpose**: Applies the database schema changes
- **Usage**: Run via API endpoint `/api/apply-system-fields-migration`

### 2. System Tasks Creation Script (`src/scripts/create-system-tasks-for-existing-clients.ts`)
- **Purpose**: Creates system tasks for all existing clients
- **Usage**: Run via API endpoint `/api/create-system-tasks-for-existing-clients`

## How It Works

### For New Clients
1. When a client is created, the system automatically:
   - Creates a "Time Tracking" project (marked as system-generated)
   - Creates a "General" task within that project (marked as system-generated)
   - Assigns the General task to all active users

### For Time Tracking
1. Users see both regular tasks and system-generated tasks in their timer
2. System tasks are displayed as "{Client Name} - Time Tracking - General"
3. Time entries are recorded normally and appear in all reports

### For Reports and Logs
1. System-generated tasks appear in time entries, reports, and logs
2. They are labeled as "{Client Name} - Time Tracking - General"
3. No special handling needed - they work like regular tasks for reporting

### For Admin Management
1. System-generated projects and tasks are hidden from regular project/task listings
2. They don't appear in the admin projects or tasks pages
3. They cannot be accidentally deleted or modified through the regular UI

## Testing

### API Endpoints Tested
- ✅ `/api/apply-system-fields-migration` - Database migration applied
- ✅ `/api/create-system-tasks-for-existing-clients` - Created system tasks for 10 clients
- ✅ `/api/system-tasks` - Returns unauthorized when not authenticated (expected)

### Database Results
- Created 10 "Time Tracking" projects
- Created 10 "General" tasks
- Created 70 task assignments (7 users × 10 clients)

## Benefits

1. **Universal Access**: Every user can track time for every client
2. **Clean UI**: System tasks don't clutter regular task/project listings
3. **Consistent Labeling**: All entries are properly labeled in reports
4. **Automatic Setup**: No manual configuration required
5. **Backward Compatible**: Existing functionality unchanged

## Future Enhancements

1. **Admin Override**: Could add admin-only view to see system tasks
2. **Custom Names**: Could allow custom names for system tasks per client
3. **Multiple System Tasks**: Could add additional system task types
4. **Bulk Operations**: Could add bulk operations for system task management
