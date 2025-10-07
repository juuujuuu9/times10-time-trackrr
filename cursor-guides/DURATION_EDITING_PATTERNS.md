# Duration Editing Implementation Patterns

## Overview
This document outlines the patterns and rules for implementing editable duration fields in the time tracking application. Following these patterns ensures consistent behavior and avoids common bugs.

## Core Pattern: Client-Side Parsing + Server Format Conversion

### 1. Client-Side Duration Parsing

**Always implement `parseFlexibleDuration()` function supporting these formats:**
- `"2h 30m"`, `"2h 30min"`, `"2 hours 30 minutes"`
- `"2h"`, `"2hr"`, `"2 hours"`
- `"150m"`, `"150min"`, `"150 minutes"`
- `"2:30"` (hours:minutes format)
- `"5400s"`, `"5400sec"`, `"5400 seconds"`

**Implementation pattern:**
```javascript
function parseFlexibleDuration(durationString: string): number | null {
  if (!durationString) return null;
  
  const trimmed = durationString.trim().toLowerCase();
  const normalized = trimmed.replace(/\s+/g, ' ');
  
  // Pattern 1: "2h 30m", "2h 30min", "2 hours 30 minutes"
  let match = normalized.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hours?)\s+(\d+)\s*(m|min|minutes?)$/);
  if (match) {
    const hours = parseFloat(match[1]);
    const minutes = parseInt(match[3]);
    if (hours >= 0 && minutes >= 0 && minutes <= 59) {
      return Math.floor(hours * 3600 + minutes * 60);
    }
  }
  
  // Additional patterns...
  return null;
}
```

### 2. Server Format Conversion (CRITICAL)

**The server's ValidationService.parseDuration() only supports single-unit formats:**
- ✅ `"2h"`, `"3.5hr"`, `"90m"`, `"5400s"`
- ❌ `"2h 30m"` format is NOT supported

**Always convert before sending to server:**
```javascript
// Convert parsed duration to server format
let serverDurationFormat: string;
const hours = Math.floor(parsedDuration / 3600);
const minutes = Math.floor((parsedDuration % 3600) / 60);

if (hours > 0 && minutes > 0) {
  // For combined hours and minutes, use decimal hours format
  const totalHours = hours + (minutes / 60);
  serverDurationFormat = `${totalHours}h`;
} else if (hours > 0) {
  // Just hours
  serverDurationFormat = `${hours}h`;
} else {
  // Just minutes
  serverDurationFormat = `${minutes}m`;
}

const updateData = {
  duration: serverDurationFormat
};
```

### 3. UI State Management

**When duration is manually edited:**
```javascript
// Disable start/stop inputs
const startInput = row?.querySelector('input[data-time-type="start"]') as HTMLInputElement;
const endInput = row?.querySelector('input[data-time-type="end"]') as HTMLInputElement;

if (startInput) {
  startInput.readOnly = true;
  startInput.classList.add('bg-gray-100', 'cursor-not-allowed');
  startInput.title = 'Manual duration entry - use edit button to modify';
  startInput.value = '--:-- --'; // Clear the value
}

if (endInput) {
  endInput.readOnly = true;
  endInput.classList.add('bg-gray-100', 'cursor-not-allowed');
  endInput.title = 'Manual duration entry - use edit button to modify';
  endInput.value = '--:-- --'; // Clear the value
}
```

### 4. Table Updates

**Always target input elements, not cells:**
```javascript
// ✅ CORRECT
const durationCell = row?.querySelector('td[data-role="duration"] input') as HTMLInputElement;
durationCell.value = `${hours}h ${minutes}m`;

// ❌ WRONG - This replaces input with text
const durationCell = row?.querySelector('td[data-role="duration"]');
durationCell.textContent = formatDuration(duration);
```

**Use MutationObserver for dynamic content:**
```javascript
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList') {
      const durationInputs = document.querySelectorAll('.duration-input');
      if (durationInputs.length > 0) {
        handleDurationInputChange();
      }
    }
  });
});
```

### 5. Modal Integration

**Apply same patterns in modal forms:**
```javascript
// Parse and validate duration input
const parsedDuration = parseFlexibleDuration(durationInput.value);
if (!parsedDuration) {
  alert('Please enter a valid duration format (e.g., 2h 30m, 2.5h, 150m, 2:30)');
  return;
}

// Convert to server format
let serverDurationFormat: string;
const hours = Math.floor(parsedDuration / 3600);
const minutes = Math.floor((parsedDuration % 3600) / 60);

if (hours > 0 && minutes > 0) {
  const totalHours = hours + (minutes / 60);
  serverDurationFormat = `${totalHours}h`;
} else if (hours > 0) {
  serverDurationFormat = `${hours}h`;
} else {
  serverDurationFormat = `${minutes}m`;
}

updateData.duration = serverDurationFormat;
```

### 6. API Integration

**Use the unified endpoint:**
```javascript
const response = await fetch(`/api/time-entries-unified/${entryId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    duration: serverDurationFormat // Send converted format
  })
});
```

**Handle response and update UI:**
```javascript
if (response.ok) {
  const result = await response.json();
  
  // Update duration display
  const durationCell = row?.querySelector('td[data-role="duration"] input') as HTMLInputElement;
  if (durationCell && result.data) {
    const hours = Math.floor(result.data.durationManual / 3600);
    const minutes = Math.floor((result.data.durationManual % 3600) / 60);
    durationCell.value = `${hours}h ${minutes}m`;
  }
  
  // Refresh row data for subsequent edits
  const editBtn = row?.querySelector('.edit-time-entry-btn') as HTMLElement;
  if (editBtn) {
    editBtn.setAttribute('data-entry', JSON.stringify(result.data));
  }
}
```

## Common Pitfalls to Avoid

### ❌ Don't Do These:
1. **Sending raw user input to server** - Always convert format first
2. **Using textContent instead of value** - This breaks input functionality
3. **Forgetting to disable start/stop inputs** - Users get confused about entry state
4. **Not clearing start/stop values** - Should show `--:-- --` for manual duration entries
5. **Missing MutationObserver setup** - Dynamic content won't have event handlers

### ✅ Do These:
1. **Always parse client-side first** - Use flexible parsing for user experience
2. **Convert to server format** - Ensure compatibility with ValidationService
3. **Update input values, not textContent** - Preserve input functionality
4. **Clear and disable related inputs** - Provide clear visual feedback
5. **Use MutationObserver for dynamic content** - Ensure handlers work after DOM updates
6. **Refresh row data after updates** - Keep subsequent edits working correctly

## Testing Checklist

When implementing duration editing:

- [ ] User can enter natural formats like "2h 30m", "1.5h", "90m"
- [ ] Server receives converted format (e.g., "2.5h" for "2h 30m")
- [ ] Start/stop inputs are disabled and cleared when duration is edited
- [ ] Duration input remains editable after start/stop time changes
- [ ] Modal editing works with same format conversion
- [ ] Error handling for invalid formats
- [ ] Visual feedback (success/error states)
- [ ] Row data is refreshed after successful updates
- [ ] MutationObserver handles dynamic content updates

## File Locations

- **Dashboard inline editing**: `src/pages/dashboard.astro` (lines ~2780-2950)
- **Modal editing**: `src/pages/dashboard.astro` (lines ~2430-2460)
- **Duration parsing**: `src/pages/dashboard.astro` (lines ~1520-1576)
- **Server validation**: `src/services/validationService.ts` (lines ~76-110)

This pattern ensures consistent, bug-free duration editing across all interfaces.
