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
- If the requested feature needs server changes, stop and emit a TODO using /docs/api/extension-proposal.md template.

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
 * TODO(api-extension) and stop. See /docs/api/extension-proposal.md.
 */
```
