# Dashboard Filtering Patterns

## Server-Side vs Client-Side Filtering

### Critical Rule: Always Use Server-Side Filtering
**NEVER implement client-side filtering for data that should be filtered by time periods or database criteria.**

#### ❌ WRONG - Client-Side Filtering
```javascript
// Filtering already-filtered data on client side
const filteredData = allData.filter(item => item.client === selectedClient);
```

#### ✅ CORRECT - Server-Side Filtering
```javascript
// Filter at database level with proper conditions
const filteredData = await db.select()
  .where(and(
    eq(clients.name, selectedClient),
    timePeriodFilter
  ));
```

### When to Use Each Approach

#### Server-Side Filtering (Database Level)
- ✅ Time period filtering (Today, This Week, This Month)
- ✅ Client filtering (Team/Project specific clients)
- ✅ User role filtering (Admin vs regular user)
- ✅ Data that affects calculations and metrics
- ✅ Large datasets that need performance optimization

#### Client-Side Filtering (JavaScript)
- ✅ UI state filtering (show/hide elements)
- ✅ Search/filter within already-loaded data
- ✅ Tab switching and navigation
- ✅ Form validation and input filtering

## Multi-Tab Filtering Architecture

### Independent Tab Filtering Pattern
When building dashboards with multiple tabs that need different filtering:

```typescript
// 1. Separate URL parameters for each tab
const teamClientFilter = Astro.url.searchParams.get('teamClient') || 'all';
const projectClientFilter = Astro.url.searchParams.get('projectClient') || 'all';

// 2. Separate database queries for each tab
const teamData = await db.select().where(teamFilterConditions);
const projectData = await db.select().where(projectFilterConditions);
const clientData = await db.select().where(clientFilterConditions);

// 3. Independent JavaScript handlers
function updateTeamClientFilter(client) {
  const url = new URL(window.location.href);
  url.searchParams.set('teamClient', client);
  window.location.href = url.toString();
}
```

### Tab-Specific Filtering Rules
- **Team Tab**: Filter by `teamClient` parameter
- **Project Tab**: Filter by `projectClient` parameter  
- **Client Tab**: No client filtering (always show all)
- **Time Period**: Applied to all tabs consistently

## Dropdown State Management

### Persistent Dropdown Options Pattern
**ALWAYS keep all options visible in dropdowns, regardless of current filter state.**

#### ❌ WRONG - Filtered Dropdown Options
```javascript
// Options disappear when filtered
const options = filteredData.map(item => item.client);
```

#### ✅ CORRECT - Persistent Dropdown Options
```javascript
// Always show all available options
const allClients = await db.select({ name: clients.name })
  .from(clients)
  .where(eq(clients.archived, false));

// Use for dropdown options
{allClients.map(client => (
  <option value={client.name}>{client.name}</option>
))}
```

### Dropdown Selection State
```javascript
// Always show current selection
<option value="all" selected={currentFilter === 'all'}>All Clients</option>
{allClients.map(client => (
  <option value={client.name} selected={currentFilter === client.name}>
    {client.name}
  </option>
))}
```

## URL Parameter Management

### URL-Based State Pattern
**Use URL parameters for all filter state to enable bookmarking and sharing.**

```javascript
// Update URL parameters instead of local state
function updateFilter(filterType, value) {
  const url = new URL(window.location.href);
  if (value === 'all') {
    url.searchParams.delete(filterType);
  } else {
    url.searchParams.set(filterType, value);
  }
  window.location.href = url.toString();
}
```

### Parameter Naming Convention
- `period` - Time period filter (today, week, month, quarter)
- `teamClient` - Client filter for team tab
- `projectClient` - Client filter for project tab
- `view` - Tab/view selection
- `teamMember` - Specific team member filter

## Database Query Optimization

### Separate Queries for Different Views
```typescript
// Don't try to use one query for all tabs
// Instead, create specific queries for each use case

// Team analysis query
const teamEntries = await db.select()
  .where(and(
    timePeriodFilter,
    teamClientFilter,
    notArchivedFilter
  ));

// Project analysis query  
const projectEntries = await db.select()
  .where(and(
    timePeriodFilter,
    projectClientFilter,
    notArchivedFilter
  ));

// Client analysis query (no client filtering)
const clientEntries = await db.select()
  .where(and(
    timePeriodFilter,
    notArchivedFilter
  ));
```

### Filter Condition Building
```typescript
// Build filter conditions systematically
let filterConditions = [
  eq(clients.archived, false),
  eq(projects.archived, false)
];

// Add time period filter
if (startDate && endDate) {
  filterConditions.push(sql`(
    (${timeEntries.startTime} IS NOT NULL AND ${timeEntries.startTime} >= ${startDate} AND ${timeEntries.startTime} <= ${endDate})
    OR 
    (${timeEntries.startTime} IS NULL AND ${timeEntries.createdAt} >= ${startDate} AND ${timeEntries.createdAt} <= ${endDate})
  )`);
}

// Add client filter if needed
if (clientFilter !== 'all') {
  filterConditions.push(eq(clients.name, clientFilter));
}
```

## JavaScript Event Handling

### Proper Event Listener Attachment
```javascript
// Always check if element exists before attaching listeners
const filterElement = document.getElementById('filterId');
if (filterElement) {
  filterElement.addEventListener('change', function() {
    const value = this.value;
    updateFilter('filterType', value);
  });
} else {
  console.log('Filter element not found');
}
```

### TypeScript Type Safety
```typescript
// Use proper type annotations for event handlers
const filterElement = document.getElementById('filterId') as HTMLSelectElement;
if (filterElement) {
  filterElement.addEventListener('change', function(this: HTMLSelectElement) {
    const value = this.value;
    updateFilter('filterType', value);
  });
}
```

## Common Anti-Patterns to Avoid

### ❌ DON'T
- Filter dropdown options based on current selection
- Use client-side filtering for server-side data
- Mix filtering logic between tabs
- Forget to handle "all" or "none" filter states
- Use inline event handlers in Astro components
- Forget to check if DOM elements exist before attaching listeners

### ✅ DO
- Keep all dropdown options visible
- Use server-side filtering for data queries
- Create separate queries for different views
- Handle "all" states properly (delete URL param vs set to 'all')
- Use proper event listeners with error checking
- Always verify DOM elements exist before manipulation

## Testing Filtering Systems

### Manual Testing Checklist
- [ ] All dropdown options remain visible after filtering
- [ ] URL parameters update correctly
- [ ] Page reloads with correct filtered data
- [ ] Different tabs can have different filters
- [ ] Time period filtering works across all tabs
- [ ] "All" options work correctly (remove URL params)
- [ ] Bookmarking filtered URLs works
- [ ] Back/forward browser navigation works

### Debug Patterns
```javascript
// Add debugging for filter state
console.log('Current filters:', {
  period: Astro.url.searchParams.get('period'),
  teamClient: Astro.url.searchParams.get('teamClient'),
  projectClient: Astro.url.searchParams.get('projectClient')
});

// Debug database queries
console.log('Filter conditions:', filterConditions);
console.log('Query results:', results.length);
```

## Performance Considerations

### Database Query Optimization
- Use separate queries for different views instead of filtering large datasets
- Apply filters at database level, not in application code
- Use proper indexes on filtered columns
- Limit result sets with appropriate WHERE clauses

### Client-Side Performance
- Minimize DOM manipulation
- Use efficient event listeners
- Avoid unnecessary page reloads for simple UI changes
- Cache frequently accessed DOM elements

---

*These patterns ensure robust, maintainable filtering systems that provide excellent user experience while maintaining good performance.*
