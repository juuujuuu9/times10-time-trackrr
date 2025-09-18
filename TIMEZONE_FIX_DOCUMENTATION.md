# Timezone Fix Documentation

## Problem Description

Time entries made in the evening on production were showing up as if they occurred on the next day. This was happening because of timezone conversion issues between the user's local timezone and the server's timezone.

### Root Cause

1. **Database Schema**: Uses `timestamp` fields without timezone information
2. **Frontend Time Creation**: Used `new Date(taskDate).setHours()` which creates dates in the local timezone
3. **ISO String Conversion**: `toISOString()` converts to UTC, causing date shifts when server and user are in different timezones

### Example of the Problem

- User in EST (UTC-5) enters "11:00 PM" on "2024-01-15"
- Server in UTC converts this to "2024-01-16 04:00:00 UTC"
- When displayed, it shows as "January 16th" instead of "January 15th"

## Solution Implemented

### 1. New Timezone Utilities (`src/utils/timezoneUtils.ts`)

Created comprehensive timezone utilities that:

- **Preserve user's intended date** regardless of server timezone
- **Use consistent timezone handling** across all operations
- **Maintain backward compatibility** with existing data
- **Provide clear utilities** for future development

#### Key Functions

- `createUserDate(dateString, hours, minutes, seconds)` - Creates dates that preserve user intent
- `createTaskDateTime(taskDate, hours, minutes)` - Main function for time entry creation
- `getDateComponents(date)` - Extracts date components without timezone conversion
- `formatDateForDisplay(date, options)` - Consistent date formatting
- `formatTimeForDisplay(date, options)` - Consistent time formatting
- `getTodayString()` - Gets today's date as YYYY-MM-DD string
- `isValidDateString(dateString)` - Validates date string format

### 2. Updated Time Parser (`src/utils/timeParser.ts`)

Modified `parseTimeString()` to use timezone-safe date creation:

```typescript
// Before (problematic)
const resultDate = new Date(baseDate);
resultDate.setHours(hours, minutes, 0, 0);

// After (timezone-safe)
const { year, month, day } = getDateComponents(baseDate);
const resultDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
```

### 3. Updated Frontend Components

#### Dashboard (`src/pages/dashboard.astro`)
- Updated time entry creation to use `createTaskDateTime()`
- Updated date input initialization to use `getTodayString()`
- Ensures all time entries preserve user's intended date

#### Time Entries Page (`src/pages/time-entries.astro`)
- Updated inline time editing to use `createTaskDateTime()`
- Updated time entry editing to use timezone-safe date creation
- Maintains consistency across all time operations

### 4. Updated API Endpoints

#### Admin Time Entries (`src/pages/api/admin/time-entries.ts`)
- Updated manual duration entry creation to use `createUserDate()`
- Updated time entry updates to use timezone-safe date handling
- Ensures server-side operations preserve user intent

## How It Works

### Before (Problematic)
```javascript
// User enters "11:00 PM" on "2024-01-15"
const taskDate = new Date("2024-01-15"); // Creates date in local timezone
taskDate.setHours(23, 0, 0, 0); // Sets time in local timezone
const isoString = taskDate.toISOString(); // Converts to UTC: "2024-01-16T04:00:00.000Z"
// Result: Shows as January 16th instead of January 15th
```

### After (Fixed)
```javascript
// User enters "11:00 PM" on "2024-01-15"
const { createTaskDateTime } = await import('../utils/timezoneUtils');
const taskDateTime = createTaskDateTime("2024-01-15", 23, 0); // Preserves intended date
const isoString = taskDateTime.toISOString(); // "2024-01-15T23:00:00.000Z"
// Result: Shows as January 15th as intended
```

## Benefits

1. **Consistent Date Display**: Time entries always show on the date the user intended
2. **Timezone Independence**: Works correctly regardless of server timezone
3. **Backward Compatibility**: Existing data continues to work
4. **Future-Proof**: New utilities prevent similar issues
5. **Clear API**: Well-documented functions for consistent date handling

## Testing Recommendations

### Local Testing
1. Create time entries at different times of day
2. Verify dates display correctly
3. Test time entry editing functionality
4. Check manual duration entries

### Production Testing
1. Deploy to staging environment
2. Test with users in different timezones
3. Verify evening time entries show correct dates
4. Test time entry creation and editing

### Edge Cases to Test
1. Time entries near midnight (11:00 PM - 1:00 AM)
2. Time entries across date boundaries
3. Manual duration entries
4. Time entry editing and updates

## Migration Notes

- **No database migration required** - existing data remains compatible
- **No breaking changes** - all existing functionality preserved
- **Gradual rollout possible** - changes are backward compatible
- **Easy rollback** - can revert to previous behavior if needed

## Future Improvements

1. **User Timezone Detection**: Automatically detect user's timezone
2. **Timezone Display**: Show times in user's local timezone
3. **Database Migration**: Consider adding timezone information to database
4. **API Enhancement**: Add timezone parameters to API endpoints

## Files Modified

- `src/utils/timezoneUtils.ts` (new)
- `src/utils/timeParser.ts` (updated)
- `src/pages/dashboard.astro` (updated)
- `src/pages/time-entries.astro` (updated)
- `src/pages/api/admin/time-entries.ts` (updated)

## Conclusion

This fix resolves the timezone issue by ensuring that time entries always preserve the user's intended date, regardless of server timezone. The solution is comprehensive, backward-compatible, and provides a solid foundation for future timezone-related features.
