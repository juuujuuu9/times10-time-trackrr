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

### Date Input Handler Pattern
```javascript
// Date inputs need both blur and Enter key handlers
dateInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    this.blur(); // Trigger the blur event to save
  }
});

dateInput.addEventListener('blur', async function() {
  const entryId = this.getAttribute('data-entry-id');
  const currentDate = this.getAttribute('data-current-date');
  const newValue = this.value.trim();
  
  if (!newValue) {
    this.value = convertToDisplayDate(currentDate || '');
    return;
  }
  
  if (!validateDateFormat(newValue)) {
    alert('Please enter the date in mm/dd/yyyy format (e.g., 12/25/2023)');
    this.value = convertToDisplayDate(currentDate || '');
    this.focus();
    return;
  }
  
  const newISODate = convertToISODate(newValue);
  if (newISODate === currentDate) {
    return; // No change
  }
  
  // Get current entry data to preserve times
  const row = this.closest('tr');
  const editBtn = row?.querySelector('.edit-time-entry-btn');
  const currentEntry = JSON.parse(editBtn?.getAttribute('data-entry') || '{}');
  
  const updateData = {
    taskDate: newISODate
  };
  
  // Preserve existing times with new date
  if (currentEntry?.startTime) {
    const startTime = new Date(currentEntry.startTime);
    const [year, month, day] = newISODate.split('-').map(Number);
    const newStartTime = new Date(year, month - 1, day, startTime.getHours(), startTime.getMinutes(), 0, 0);
    updateData.startTime = newStartTime.toISOString();
  }
  
  if (currentEntry?.endTime) {
    const endTime = new Date(currentEntry.endTime);
    const [year, month, day] = newISODate.split('-').map(Number);
    const newEndTime = new Date(year, month - 1, day, endTime.getHours(), endTime.getMinutes(), 0, 0);
    updateData.endTime = newEndTime.toISOString();
  }
  
  // Send update with both taskDate and updated times
  const response = await fetch(`/api/time-entries-unified/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  
  if (response.ok) {
    const result = await response.json();
    
    // Update the input with new date
    this.setAttribute('data-current-date', newISODate);
    
    // Update row data for subsequent edits
    if (editBtn && result.data) {
      editBtn.setAttribute('data-entry', JSON.stringify(result.data));
    }
    
    // Show success feedback
    this.style.backgroundColor = '#D1FAE5';
    this.style.borderColor = '#10B981';
    setTimeout(() => {
      this.style.backgroundColor = '';
      this.style.borderColor = '';
    }, 1500);
  }
});
```

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

### Date Change Handling in Service Layer
When `taskDate` is provided with ISO string times, the service must combine the new date with existing time components:

```typescript
// Handle start/end times with date changes
if (request.startTime && request.endTime) {
  let startTime = TimezoneService.fromUserISOString(request.startTime);
  let endTime = TimezoneService.fromUserISOString(request.endTime);
  
  // If taskDate is provided, update the date part while preserving the time
  if (request.taskDate) {
    const [year, month, day] = request.taskDate.split('-').map(Number);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    startTime = new Date(year, month - 1, day, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
    endTime = new Date(year, month - 1, day, endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
  }
  
  updateData.startTime = startTime;
  updateData.endTime = endTime;
  updateData.durationManual = TimezoneService.calculateDuration(startTime, endTime);
}
```

**Critical**: The service layer must handle the combination of `taskDate` with existing ISO string times. Without this, date changes will appear to save (green highlight) but revert on page refresh because the database isn't actually updated with the new date.

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

// Date inputs without Enter key handlers
dateInput.addEventListener('blur', saveDate); // Missing Enter key support

// Service layer ignoring taskDate with ISO strings
if (request.startTime && request.endTime) {
  updateData.startTime = TimezoneService.fromUserISOString(request.startTime);
  updateData.endTime = TimezoneService.fromUserISOString(request.endTime);
  // ❌ Missing: taskDate handling for date changes
}
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

// Date inputs with both blur and Enter key handlers
dateInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    this.blur();
  }
});
dateInput.addEventListener('blur', saveDate);

// Service layer handling taskDate with ISO strings
if (request.startTime && request.endTime) {
  let startTime = TimezoneService.fromUserISOString(request.startTime);
  let endTime = TimezoneService.fromUserISOString(request.endTime);
  
  if (request.taskDate) {
    const [year, month, day] = request.taskDate.split('-').map(Number);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    startTime = new Date(year, month - 1, day, startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
    endTime = new Date(year, month - 1, day, endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
  }
  
  updateData.startTime = startTime;
  updateData.endTime = endTime;
}
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
11. **Add Enter key handlers** to date inputs (like time inputs)
12. **Handle date changes** by combining taskDate with existing times
13. **Service layer must process** taskDate + ISO string combinations
14. **Test date persistence** after page refresh

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

For implementing editable duration fields, see `/cursor-guides/DURATION_EDITING_PATTERNS.md` for comprehensive patterns covering:

- Client-side flexible duration parsing
- Server format conversion requirements  
- UI state management for manual duration entries
- Table update patterns to preserve input functionality
- Modal integration consistency
- Common pitfalls and testing checklist

**Key Rule**: Always convert user input (e.g., "2h 30m") to server format (e.g., "2.5h") before API calls, as the server's ValidationService only supports single-unit formats.

## Date Picker Integration Patterns

### Flatpickr Integration Best Practices
When replacing custom date pickers with Flatpickr:

**✅ CORRECT Implementation:**
```javascript
// Initialize Flatpickr with proper date handling
const flatpickrInstance = flatpickr(dateInput, {
  dateFormat: 'm/d/Y',
  defaultDate: currentDate ? new Date(currentDate + 'T00:00:00') : new Date(),
  allowInput: true,
  clickOpens: true,
  static: true,
  monthSelectorType: 'static',
  onChange: function(selectedDates, dateStr, instance) {
    if (selectedDates.length > 0) {
      const selectedDate = selectedDates[0];
      const isoDate = selectedDate.toISOString().split('T')[0];
      dateInput.setAttribute('data-current-date', isoDate);
      
      // Use dedicated save function, not blur event
      if (entryId) {
        saveDateChange(dateInput, entryId!, isoDate);
      }
    }
  }
});
```

**❌ WRONG Patterns:**
```javascript
// Don't use blur events with Flatpickr - causes conflicts
dateInput.addEventListener('blur', saveDate);

// Don't pass ISO strings directly to defaultDate
defaultDate: currentDate // Can cause timezone issues

// Don't use PATCH if endpoint only supports PUT
method: 'PATCH' // Check API endpoint methods first
```

### API Method Verification
**Critical**: Always verify which HTTP methods the API endpoint supports before implementing:

```javascript
// Check available methods in API file
// time-entries-unified/[id].ts supports: GET, PUT, DELETE
// Does NOT support: PATCH

// Use correct method
const response = await fetch(`/api/time-entries-unified/${entryId}`, {
  method: 'PUT', // Not PATCH
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateData)
});
```

### Date Picker Save Function Pattern
```javascript
async function saveDateChange(dateInput, entryId, newISODate) {
  try {
    // Get current entry data from edit button
    const row = dateInput.closest('tr');
    const editBtn = row?.querySelector('.edit-time-entry-btn');
    const entryData = editBtn?.getAttribute('data-entry');
    const currentEntry = JSON.parse(entryData || '{}');
    
    if (!currentEntry) {
      console.error('Could not find entry data for date change');
      return;
    }
    
    // Parse new date components
    const [year, month, day] = newISODate.split('-').map(Number);
    
    const updateData = { taskDate: newISODate };
    
    // Update start and end times with new date
    if (currentEntry.startTime) {
      const startTime = new Date(currentEntry.startTime);
      const newStartTime = new Date(year, month - 1, day, startTime.getHours(), startTime.getMinutes(), 0, 0);
      updateData.startTime = newStartTime.toISOString();
    }
    
    if (currentEntry.endTime) {
      const endTime = new Date(currentEntry.endTime);
      const newEndTime = new Date(year, month - 1, day, endTime.getHours(), endTime.getMinutes(), 0, 0);
      updateData.endTime = newEndTime.toISOString();
    }
    
    // Use correct HTTP method (PUT, not PATCH)
    const response = await fetch(`/api/time-entries-unified/${entryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      // Show success feedback
      dateInput.style.backgroundColor = '#d4edda';
      dateInput.style.borderColor = '#28a745';
      setTimeout(() => {
        dateInput.style.backgroundColor = '';
        dateInput.style.borderColor = '';
      }, 1500);
    } else {
      // Revert on failure
      const originalDate = dateInput.getAttribute('data-current-date');
      if (originalDate) {
        const [origYear, origMonth, origDay] = originalDate.split('-').map(Number);
        dateInput.value = `${String(origMonth).padStart(2, '0')}/${String(origDay).padStart(2, '0')}/${origYear}`;
        dateInput.setAttribute('data-current-date', originalDate);
      }
    }
  } catch (error) {
    console.error('Error updating date:', error);
    // Revert input value
  }
}
```

### Flatpickr CSS Integration
Add Flatpickr CSS to Layout.astro:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
```

### Common Date Picker Issues & Solutions

**Issue**: Dates showing in wrong year (2026 instead of current)
**Solution**: Add time component to defaultDate
```javascript
defaultDate: currentDate ? new Date(currentDate + 'T00:00:00') : new Date()
```

**Issue**: Changes not saving
**Solution**: Check API method support and use correct HTTP method

**Issue**: Conflicts with existing blur handlers
**Solution**: Use dedicated save function instead of triggering blur events

**Issue**: Date picker not initializing on dynamic content
**Solution**: Use MutationObserver to reinitialize after content changes
```javascript
// Re-setup after data reload using MutationObserver
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList') {
      const dateInputs = document.querySelectorAll('.date-input');
      if (dateInputs.length > 0) {
        initializeFlatpickr();
      }
    }
  });
});
```

### Testing Date Picker Integration
- [ ] Date picker opens with correct current date
- [ ] Date selection triggers save function
- [ ] Success feedback (green border) appears
- [ ] Changes persist after page refresh
- [ ] Error handling reverts to original date
- [ ] Works with dynamic content loading
- [ ] No conflicts with existing input handlers

## Debugging Patterns

### Common Debugging Issues & Solutions

**Issue**: Date picker changes not saving
**Debug Steps**:
1. Check browser console for API errors (404, 500, etc.)
2. Verify HTTP method matches API endpoint support
3. Check if onChange event is being triggered
4. Verify entry data is being found correctly

**Debug Code Pattern**:
```javascript
// Add temporary debugging to identify issues
onChange: function(selectedDates, dateStr, instance) {
  console.log('Flatpickr onChange triggered:', { selectedDates, dateStr, entryId });
  if (selectedDates.length > 0) {
    const selectedDate = selectedDates[0];
    const isoDate = selectedDate.toISOString().split('T')[0];
    console.log('Selected date:', isoDate);
    dateInput.setAttribute('data-current-date', isoDate);
    
    if (entryId) {
      console.log('Calling saveDateChange with:', { entryId, isoDate });
      saveDateChange(dateInput, entryId!, isoDate);
    } else {
      console.error('No entryId found for date change');
    }
  }
}
```

**Issue**: API returning 404 errors
**Solution**: Check API endpoint methods in the source file
```bash
# Check what methods are exported
grep "export const" src/pages/api/time-entries-unified/[id].ts
# Should show: GET, PUT, DELETE (not PATCH)
```

**Issue**: Dates showing in wrong year
**Debug Steps**:
1. Check what `currentDate` contains
2. Verify date parsing in defaultDate
3. Test with explicit date construction

**Debug Pattern**:
```javascript
console.log('Current date from attribute:', currentDate);
console.log('Parsed date:', new Date(currentDate + 'T00:00:00'));
```

### Systematic Debugging Approach
1. **Add console logs** to track function calls
2. **Check API response status** in network tab
3. **Verify data attributes** are present
4. **Test with hardcoded values** to isolate issues
5. **Check for TypeScript errors** in build
6. **Remove debugging code** once issue is resolved

### Performance Considerations
- Remove debugging console.log statements in production
- Use conditional debugging for development only
- Test with and without debugging code to ensure functionality
