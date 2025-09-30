# API Contracts and Optimistic Updates

## Overview
This document defines the contracts for API interactions and optimistic update patterns in the Times10 Time Tracker application.

## Mutation Contracts

### Time Entry Mutations

#### Start Timer
```typescript
// Optimistic update: Immediately show timer as started
// Network call: POST /api/timers/ongoing
// On success: Update timer state, start polling
// On error: Revert to previous state, show error message
```

#### Stop Timer
```typescript
// Optimistic update: Immediately show timer as stopped
// Network call: POST /api/timers/ongoing/stop
// On success: Update timer state, stop polling, create time entry
// On error: Revert to previous state, show error message
```

#### Create Time Entry
```typescript
// Optimistic update: Add entry to list immediately
// Network call: POST /api/time-entries-unified
// On success: Confirm entry in list
// On error: Remove from list, show error message
```

#### Update Time Entry
```typescript
// Optimistic update: Update entry in list immediately
// Network call: PATCH /api/time-entries-unified/{id}
// On success: Confirm changes
// On error: Revert changes, show error message
```

#### Delete Time Entry
```typescript
// Optimistic update: Remove entry from list immediately
// Network call: DELETE /api/time-entries-unified/{id}
// On success: Confirm removal
// On error: Restore entry, show error message
```

## React Query Configuration

### Mutation Keys
```typescript
const mutationKeys = {
  timeEntry: (id: number, action: string) => ["timeEntry", id, action],
  timer: (action: string) => ["timer", action],
  timeEntries: () => ["timeEntries"],
} as const;
```

### Query Keys
```typescript
const queryKeys = {
  timeEntries: (filters?: object) => ["timeEntries", filters],
  ongoingTimer: (userId?: number) => ["ongoingTimer", userId],
  user: (id: number) => ["user", id],
} as const;
```

### Network Mode
- **Mutations:** `networkMode: 'online'` only
- **Queries:** `networkMode: 'online'` for real-time data, `'offlineFirst'` for cached data

## Error Handling Patterns

### Network Errors
```typescript
// Retry logic
const retryConfig = {
  retry: (failureCount: number, error: Error) => {
    if (error.message.includes('401') || error.message.includes('403')) {
      return false; // Don't retry auth errors
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};
```

### Validation Errors
```typescript
// Show field-specific errors
const handleValidationError = (error: ZodError) => {
  const fieldErrors = error.flatten().fieldErrors;
  // Display errors next to relevant form fields
};
```

### Timeout Errors
```typescript
// Show user-friendly timeout message
const handleTimeoutError = () => {
  return "Request timed out. Please check your connection and try again.";
};
```

## Loading States

### Button States
```typescript
// Disable buttons during pending mutations
const isPending = mutation.isPending;
const isDisabled = isPending || !isOnline;

<button disabled={isDisabled} onClick={handleClick}>
  {isPending ? "Processing..." : "Submit"}
</button>
```

### Form States
```typescript
// Show loading indicators for form submissions
const isSubmitting = createMutation.isPending || updateMutation.isPending;
```

## Cache Invalidation

### After Successful Mutations
```typescript
// Invalidate related queries
const queryClient = useQueryClient();

// After creating time entry
queryClient.invalidateQueries({ queryKey: ["timeEntries"] });

// After updating time entry
queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
queryClient.invalidateQueries({ queryKey: ["timeEntry", id] });

// After deleting time entry
queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
queryClient.removeQueries({ queryKey: ["timeEntry", id] });
```

### Optimistic Updates
```typescript
// Update cache optimistically
const optimisticUpdate = (newData: TimeEntry) => {
  queryClient.setQueryData(["timeEntries"], (old: TimeEntry[]) => 
    old ? [...old, newData] : [newData]
  );
};

// Revert on error
const revertUpdate = (previousData: TimeEntry[]) => {
  queryClient.setQueryData(["timeEntries"], previousData);
};
```

## Concurrent Request Prevention

### Single Request Guarantee
```typescript
// Prevent duplicate requests
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  try {
    await mutation.mutateAsync(data);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Request Deduplication
```typescript
// Use React Query's built-in deduplication
const query = useQuery({
  queryKey: ["timeEntries", filters],
  queryFn: () => api.listEntries(filters),
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
});
```

## Real-time Updates

### Timer Polling
```typescript
// Poll ongoing timer every 2 seconds
const { data: timer } = useQuery({
  queryKey: ["ongoingTimer", userId],
  queryFn: () => api.getOngoingTimer(userId),
  refetchInterval: 2000,
  enabled: !!userId,
});
```

### Cache Synchronization
```typescript
// Sync cache with server state
const syncCache = async () => {
  const serverData = await api.listEntries();
  queryClient.setQueryData(["timeEntries"], serverData);
};
```

## Testing Contracts

### MSW Handlers
```typescript
// Mock API responses for testing
const handlers = [
  http.post('/api/timers/ongoing', () => {
    return HttpResponse.json(mockTimerResponse);
  }),
  http.post('/api/timers/ongoing/stop', () => {
    return HttpResponse.json(mockStopResponse);
  }),
];
```

### Test Scenarios
- Happy path: Successful mutation
- 4xx errors: Client errors (validation, auth)
- 5xx errors: Server errors
- Network timeout: Request timeout
- Concurrent requests: Duplicate prevention
- Optimistic updates: Revert on error
