# Time Editing Component Development Guide

## Overview
This guide provides rules and patterns for building time editing components that work reliably across timezones and user interactions.

## Core Principles

### 1. Always Use Local Date Construction
**❌ WRONG:**
```javascript
const date = new Date("2024-09-30"); // Can shift to previous day in some timezones
```

**✅ CORRECT:**
```javascript
const [year, month, day] = "2024-09-30".split('-').map(Number);
const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
```

### 2. Send ISO Strings, Not Component Parts
**❌ WRONG:**
```javascript
// Complex timezone math that can fail
updateData = {
  startHours: 10,
  startMinutes: 30,
  taskDate: "2024-09-30",
  tzOffsetMinutes: -240
}
```

**✅ CORRECT:**
```javascript
// Simple, reliable approach
const startDateTime = new Date(2024, 8, 30, 10, 30, 0, 0); // month is 0-based
updateData = {
  startTime: startDateTime.toISOString(),
  endTime: endDateTime.toISOString()
}
```

### 3. Always Send Both Times Together
When editing one time field, always include the current value of the other field to prevent reversion.

**✅ CORRECT:**
```javascript
if (timeType === 'start') {
  updateData.startTime = newDateTime.toISOString();
  // Include current end time from input
  const endInput = row?.querySelector('input[data-time-type="end"]');
  if (endInput?.value) {
    const endParsed = parseFlexibleTime(endInput.value);
    if (endParsed) {
      const endDateTime = new Date(year, month, day, endParsed.hours, endParsed.minutes, 0, 0);
      updateData.endTime = endDateTime.toISOString();
    }
  }
}
```

## Component Patterns

### Time Input Blur Handler Pattern
```javascript
timeInput.addEventListener('blur', async function() {
  const entryId = this.getAttribute('data-entry-id');
  const timeType = this.getAttribute('data-time-type');
  const timeValue = this.value.trim();
  
  if (!timeValue || timeValue === '--:-- --') return;
  
  // Parse time
  const parsedTime = parseFlexibleTime(timeValue);
  if (!parsedTime) {
    this.style.borderColor = '#EF4444';
    alert('Invalid time format');
    return;
  }
  
  // Get task date from current entry
  const row = this.closest('tr');
  const editBtn = row?.querySelector('.edit-time-entry-btn');
  const currentEntry = JSON.parse(editBtn?.getAttribute('data-entry') || '{}');
  const taskDate = currentEntry.startTime ? new Date(currentEntry.startTime) : new Date(currentEntry.createdAt);
  
  // Create new datetime on same day
  const newDateTime = new Date(
    taskDate.getFullYear(), 
    taskDate.getMonth(), 
    taskDate.getDate(), 
    parsedTime.hours, 
    parsedTime.minutes, 
    0, 
    0
  );
  
  // Build update data with both times
  const updateData = {};
  if (timeType === 'start') {
    updateData.startTime = newDateTime.toISOString();
    // Include current end time
    const endInput = row?.querySelector('input[data-time-type="end"]');
    if (endInput?.value && endInput.value !== '--:-- --') {
      const endParsed = parseFlexibleTime(endInput.value);
      if (endParsed) {
        const endDateTime = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), endParsed.hours, endParsed.minutes, 0, 0);
        updateData.endTime = endDateTime.toISOString();
      }
    } else if (currentEntry.endTime) {
      updateData.endTime = new Date(currentEntry.endTime).toISOString();
    }
  } else if (timeType === 'end') {
    updateData.endTime = newDateTime.toISOString();
    // Include current start time
    const startInput = row?.querySelector('input[data-time-type="start"]');
    if (startInput?.value && startInput.value !== '--:-- --') {
      const startParsed = parseFlexibleTime(startInput.value);
      if (startParsed) {
        const startDateTime = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate(), startParsed.hours, startParsed.minutes, 0, 0);
        updateData.startTime = startDateTime.toISOString();
      }
    } else if (currentEntry.startTime) {
      updateData.startTime = new Date(currentEntry.startTime).toISOString();
    }
  }
  
  // Send update
  const response = await fetch(`/api/time-entries-unified/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  if (response.ok) {
    const result = await response.json();
    
    // Update duration display
    const durationCell = row?.querySelector('td[data-role="duration"]');
    if (durationCell && result.data) {
      durationCell.textContent = formatDuration(result.data.duration || 0);
    }
    
    // Update input values with server response
    const startInput = row?.querySelector('input[data-time-type="start"]');
    const endInput = row?.querySelector('input[data-time-type="end"]');
    
    if (startInput && result.data.startTime) {
      const startDate = new Date(result.data.startTime);
      startInput.value = new Intl.DateTimeFormat(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).format(startDate);
    }
    
    if (endInput && result.data.endTime) {
      const endDate = new Date(result.data.endTime);
      endInput.value = new Intl.DateTimeFormat(undefined, { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).format(endDate);
    }
    
    // CRITICAL: Refresh row data for subsequent edits
    if (editBtn) {
      editBtn.setAttribute('data-entry', JSON.stringify(result.data));
    }
  }
});
```

### Modal Form Submission Pattern
```javascript
// For date inputs, parse components to avoid timezone shifts
const [year, month, day] = dateInput.value.split('-').map(Number);
const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
const endDateTime = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

const updateData = {
  startTime: startDateTime.toISOString(),
  endTime: endDateTime.toISOString()
};
```

## Data Attribute Strategy

### Use Data Attributes for Reliable Selection
```html
<!-- Duration cells -->
<td data-role="duration" data-timer-id="${timer.id}">
  <span class="timer-duration">${duration}</span>
</td>

<!-- Regular entry duration -->
<td data-role="duration">${duration}</td>
```

```javascript
// Select by data attribute, not nth-child
const durationCell = row?.querySelector('td[data-role="duration"]');
```

## Time Parsing Requirements

### Flexible Time Parser
Components must support these formats:
- `"3p"`, `"3pm"` → 3:00 PM
- `"3a"`, `"3am"` → 3:00 AM  
- `"3:30p"`, `"3:30pm"` → 3:30 PM
- `"300p"`, `"300pm"` → 3:00 PM
- `"12:00pm"` → 12:00 PM (noon)
- `"12:00am"` → 12:00 AM (midnight)

## Server-Side Requirements

### API Endpoints Must Handle ISO Strings
```typescript
// Accept both startTime/endTime ISO strings and component parts
interface UpdateTimeEntryRequest {
  startTime?: string;  // ISO string - PREFERRED
  endTime?: string;    // ISO string - PREFERRED
  startHours?: number; // Component parts - fallback
  startMinutes?: number;
  endHours?: number;
  endMinutes?: number;
  taskDate?: string;
  tzOffsetMinutes?: number;
}
```

### Duration Calculation
```typescript
// Server should calculate duration from final start/end times
const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
```

## Testing Checklist

### Manual Testing
- [ ] Edit start time → blur → duration updates correctly
- [ ] Edit end time → blur → start time doesn't revert
- [ ] Edit both times in sequence → both persist
- [ ] Modal date selection stays on selected date
- [ ] Timer-created entries work the same as manually edited entries
- [ ] Cross-midnight times work correctly
- [ ] Different timezone users see correct local times

### Edge Cases
- [ ] Empty time fields
- [ ] Invalid time formats
- [ ] End time before start time
- [ ] Manual duration entries
- [ ] Network failures during save

## Common Pitfalls to Avoid

### ❌ Don't Use These Patterns
```javascript
// Timezone offset math
const utcHours = hours - offsetHours;

// nth-child selectors after column changes
const durationCell = row?.querySelector('td:nth-child(6)');

// Partial time updates without counterpart
updateData = { startTime: newTime };

// Date parsing that can shift days
const date = new Date(dateString);
```

### ✅ Use These Patterns Instead
```javascript
// Local date construction
const date = new Date(year, month, day, hours, minutes, 0, 0);

// Data attribute selectors
const durationCell = row?.querySelector('td[data-role="duration"]');

// Always include both times
updateData = { 
  startTime: newStartTime.toISOString(),
  endTime: currentEndTime.toISOString()
};

// Component-based date parsing
const [year, month, day] = dateString.split('-').map(Number);
```

## Implementation Checklist

When building time editing components:

1. **Parse dates from components** (year, month, day) not strings
2. **Send ISO strings** to server, not component parts
3. **Include both times** in every update
4. **Use data attributes** for reliable element selection
5. **Refresh row data** after successful saves
6. **Support flexible time formats** (3p, 3:30pm, etc.)
7. **Test cross-timezone scenarios**
8. **Handle network failures gracefully**
9. **Validate time order** (end after start)
10. **Update duration display** from server response

Following these patterns will create robust, timezone-safe time editing components that work reliably across all user scenarios.

## Field Mapping Rules (Tasks → Projects)

Our schema stores time entry ownership on `time_entries.project_id`, while much of the UI refers to a selected item as a `taskId`. To keep behavior consistent:

- UI sends `taskId` (the selected project in the current model)
- Server maps `taskId` → `projectId` when persisting

Recommended server-side mappings:

```ts
// Create
const timeEntryData: any = {
  userId: request.userId,
  projectId: request.taskId, // Map taskId (UI) to projectId (DB)
  notes: request.notes || null,
};

// Update
if (request.taskId !== undefined) {
  updateData.projectId = request.taskId; // Map taskId (UI) to projectId (DB)
}
```

Rationale:
- Prevents silent failures when trying to update non-existent `taskId` column on `time_entries`
- Keeps UI vocabulary stable while respecting the current DB schema
- Avoids breaking existing queries that join on `project_id`

When in doubt, search the schema for the authoritative column names and add a clear mapping in the service layer.

## Duration Editing Patterns

For implementing editable duration fields, see `/docs/DURATION_EDITING_PATTERNS.md` for comprehensive patterns covering:

- Client-side flexible duration parsing
- Server format conversion requirements  
- UI state management for manual duration entries
- Table update patterns to preserve input functionality
- Modal integration consistency
- Common pitfalls and testing checklist

**Key Rule**: Always convert user input (e.g., "2h 30m") to server format (e.g., "2.5h") before API calls, as the server's ValidationService only supports single-unit formats.
