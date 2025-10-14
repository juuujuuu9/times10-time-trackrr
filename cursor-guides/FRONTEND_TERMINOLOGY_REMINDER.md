# Frontend Terminology Reminder

## 🚨 CRITICAL: Use "Insights" NOT "Discussions"

### What Changed
- All user-facing text now uses "Insights" instead of "Discussions"
- This applies to buttons, labels, API responses, and search functionality

### What to Use Going Forward

#### ✅ CORRECT - Use These Terms:
- **"Insights"** - for navigation, buttons, and labels
- **"Start Insight"** - for action buttons
- **"Insight"** - for content type badges
- **"insights"** - for API endpoints and search parameters
- **"Insight created successfully"** - for API response messages

#### ❌ WRONG - Never Use These in Frontend:
- ~~"Discussions"~~ → Use "Insights"
- ~~"Start Discussion"~~ → Use "Start Insight"  
- ~~"Discussion"~~ → Use "Insight"
- ~~"discussions"~~ → Use "insights" (in API/search)

### Database vs Frontend
- **Database schema**: Keep `taskDiscussions`, `task_discussions` (unchanged)
- **Frontend text**: Always use "Insights" terminology
- **API responses**: Use "Insights" in user-facing messages
- **Search functionality**: Use "insights" parameter

### Files Already Updated
- `/src/pages/admin/collaborations/[id]/task/[taskId].astro`
- `/src/pages/api/collaborations/[id]/discussions.ts`
- `/src/pages/api/collaborations/[id]/search.ts`

### Rule Reference
This follows **RULE-021: Frontend Terminology** in `.cursorrules`

---
*Last updated: When "Discussions" was replaced with "Insights" across the frontend*
