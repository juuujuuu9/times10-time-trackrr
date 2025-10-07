# Cursor Task Prompts for Times10 Time Tracker

## Standard Task Prompt (Copy and paste this for every task)

```
Act as a senior engineer expanding an Astro/React time-tracker.

Non-negotiable constraints:
- Use ONLY the existing typed API client at src/lib/api/client.ts.
- Do NOT add or change endpoints, routes, or payload shapes.
- All inputs/outputs must pass the Zod schemas in src/lib/api/schemas.ts.
- No raw fetch/axios calls; import { api } from "src/lib/api/client".
- Preserve mutation idempotency and prevent double-submits.
- Add MSW tests for success, 400, 500, and timeout.
- If the requested feature needs server changes, stop and emit a TODO using /cursor-guides/extension-proposal.md template.

Deliverables:
- Components, hooks, and React Query usage wired to api.* helpers.
- Tests using MSW and React Testing Library.
- No schema edits, no new endpoints, no guessing missing fields.
```

## Feature Work Prompt

```
Implement a "[Feature Name]" in the existing app.

Constraints:
- Data must come exclusively from existing API endpoints.
- Use api.listEntries(), api.startTimer(), api.stopTimer(), etc.
- No new endpoints, params, or response fields.
- If performance requires server aggregation, output TODO(api-extension) and stop.

Deliver:
- React component under src/components/[FeatureName].tsx
- Unit tests with MSW fixtures for 0, many, and error cases.
- Follow existing patterns in src/components/StartStopButton.tsx
```

## Bugfix Prompt

```
Fix [specific issue] in the existing app.

Constraints:
- Only change UI/client behavior; do not change API.
- Use a single React Query mutation with disabled button while pending.
- Add a regression test proving one network call under rapid clicks.
- Follow existing error handling patterns.

Deliver:
- Updated component with fix
- Test proving the fix works
- No API changes
```

## Migration/Refactor Prompt

```
Replace any direct fetch with api.* calls and Zod validation.
Reject any file that adds endpoints or changes payloads; emit TODO(api-extension).
Update all components to use the typed API client.
```

## File Banner (Add to top of any new file)

```typescript
/**
 * IMPORTANT: This file MUST call the API only via src/lib/api/client.ts.
 * Changing endpoints, paths, or schemas is forbidden. If impossible, add a
 * TODO(api-extension) and stop. See /cursor-guides/extension-proposal.md.
 */
```

## Field Mapping Rules

### Critical: UI Field Names vs Database Schema
**ALWAYS check database schema first before implementing API calls.**

Common mappings:
- UI `taskId` → DB `projectId` (for time entries)
- UI `selectedTask` → DB `project_id` (in time_entries table)
- UI `projectId` → DB `project_id` (direct mapping)

**❌ WRONG:**
```javascript
// Sending taskId to API that expects projectId
body: JSON.stringify({ taskId: taskId })
```

**✅ CORRECT:**
```javascript
// Map UI field to DB field
body: JSON.stringify({ projectId: taskId })
```

### API Endpoint Backward Compatibility
When updating field names, support both old and new:
```typescript
const { projectId, taskId } = body;
const finalProjectId = projectId || taskId; // Support both
```

### Debugging Field Mapping Issues
- Add console logs to track field mapping
- Verify database schema field names
- Test API calls with correct field names
- Check for silent failures in API responses

See `/cursor-guides/API_FIELD_MAPPING_PATTERNS.md` for comprehensive patterns.

## Debugging Patterns

### Duration Editing Issues
When duration editing doesn't update daily totals:
1. **Check field mapping**: Ensure UI sends `projectId`, not `taskId`
2. **Add debugging logs**: Track API calls and data refresh
3. **Verify API response**: Check for silent failures
4. **Test data refresh**: Ensure both `loadTaskDailyTotals()` and `loadDailyDurationTotals()` are called

### Common Debugging Code Pattern
```javascript
// Add debugging to track the process
console.log('Duration edit successful, refreshing data...');
await loadTaskDailyTotals();
await loadDailyDurationTotals();
console.log('Data refresh completed');
```

### API Endpoint Debugging
```typescript
// In API endpoints, log field mapping
console.log('Received fields:', { projectId, taskId, finalProjectId });
console.log('Using finalProjectId:', finalProjectId);
```

## Import Path Patterns (CRITICAL)

### Vercel Build Failures - Import Path Rules
**ALWAYS verify import paths match directory depth to prevent Vercel build failures.**

#### Directory Depth Import Rules:
- `src/pages/api/*.ts` (2 levels deep) → `../../db`
- `src/pages/api/admin/*.ts` (3 levels deep) → `../../../db`
- `src/pages/api/admin/*/[*].ts` (4 levels deep) → `../../../../db`
- `src/pages/admin/*.astro` (2 levels deep) → `../../db`
- `src/pages/admin/*/index.astro` (3 levels deep) → `../../../db`

#### Common Import Path Patterns:
```typescript
// ✅ CORRECT for src/pages/api/time-entries/duration.ts
import { db } from '../../../db';
import { timeEntries } from '../../../db/schema';

// ✅ CORRECT for src/pages/api/admin/clients.ts  
import { db } from '../../../db';
import { clients } from '../../../db/schema';

// ✅ CORRECT for src/pages/admin/index.astro
import { db } from '../../db';
import { timeEntries } from '../../db/schema';

// ❌ WRONG - Will cause Vercel build failure
import { db } from '../../../db'; // In 2-level deep file
```

#### Pre-Deployment Checklist:
1. **Test build locally**: `npm run build` must pass
2. **Check import paths**: Verify relative paths match directory depth
3. **Fix systematically**: Use find/replace for bulk fixes
4. **Verify all subdirectories**: Don't miss nested directories

#### Debugging Import Path Issues:
```bash
# Find files with incorrect import paths
find src -name "*.ts" -o -name "*.astro" | xargs grep -l "from '\.\./\.\./\.\./db'"

# Fix based on directory depth
# 2 levels: ../../db
# 3 levels: ../../../db  
# 4 levels: ../../../../db
```

### Build Error Patterns
**Common Vercel build failures and solutions:**

1. **"Could not resolve" errors**: Always check import paths
2. **Directory depth mismatch**: Count `../` levels carefully
3. **Subdirectory imports**: Nested directories need more `../`
4. **Bulk fixes needed**: Use sed/find commands for efficiency

### Prevention Rules:
- **ALWAYS test build before pushing**: `npm run build`
- **Check import paths in new files**: Match directory depth
- **Use consistent patterns**: Follow existing working examples
- **Fix systematically**: Don't fix one file at a time for bulk issues

## Documentation Organization Rules

### Cursor Rules Documentation
**ALWAYS add new cursor-related documentation to the `cursor-guides/` folder.**

#### Documentation Placement Rules:
- **Cursor rules and patterns**: `/cursor-guides/`
- **API extension templates**: `/cursor-guides/`
- **Development patterns**: `/cursor-guides/`
- **Build/deployment guides**: `/cursor-guides/`
- **Field mapping patterns**: `/cursor-guides/`

#### When Creating New Documentation:
1. **Check if it's cursor-related**: Does it help with development patterns, rules, or workflows?
2. **If YES**: Add to `cursor-guides/` folder
3. **If NO**: Add to `docs/` folder or root as appropriate
4. **Update references**: Update any references in `cursor-task-prompts.md`
5. **Update README**: Update `cursor-guides/README.md` if needed

#### Documentation Types for `cursor-guides/`:
- ✅ Cursor rules and task prompts
- ✅ API extension templates
- ✅ Development patterns and workflows
- ✅ Build/deployment troubleshooting
- ✅ Field mapping patterns
- ✅ Code organization rules
- ✅ Testing patterns
- ✅ Import path rules

#### Documentation Types for `docs/` or root:
- ❌ General project documentation
- ❌ User guides and setup instructions
- ❌ API documentation
- ❌ Deployment guides
- ❌ Feature documentation

### File Organization Pattern:
```
cursor-guides/           # Cursor rules and development patterns
├── README.md            # Organization guide
├── cursor-task-prompts.md  # Main cursor rules
└── [pattern-name].md    # Specific development patterns

docs/                    # General project documentation
├── api/                 # API documentation
└── [feature].md         # Feature-specific docs

README.md               # Main project README (root level)
```
