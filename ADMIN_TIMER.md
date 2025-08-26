# Admin Timer Feature

## Overview

The Admin Timer is a minified time tracking component that allows admin users to track their time directly from the admin dashboard. It's located in the admin sidebar below the navigation menu.

## Features

### Core Functionality
- **Real-time Timer**: Displays elapsed time in HH:MM:SS format
- **Task Selection**: Dropdown to select from assigned tasks
- **Start/Stop Controls**: Simple start and stop buttons
- **Automatic Persistence**: Timer state is saved to localStorage and persists across page refreshes
- **Time Entry Creation**: Automatically creates time entries when timer is stopped

### User Experience
- **Compact Design**: Fits perfectly in the admin sidebar
- **Live Status Indicator**: Shows "Live" with pulsing dot when timer is running
- **Task Display**: Shows currently tracked task when running
- **Quick Task Change**: Option to change task when not running
- **Success Feedback**: Alert confirmation when time entry is saved

## Technical Implementation

### Component Location
- **File**: `src/components/AdminTimer.tsx`
- **Integration**: `src/layouts/AdminLayout.astro`

### Key Features
1. **Multi-user Support**: Each admin user has their own timer state
2. **Cross-tab Synchronization**: Timer state syncs across browser tabs
3. **Session Validation**: Automatically validates user session
4. **Error Handling**: Graceful error handling with user feedback
5. **Responsive Design**: Adapts to sidebar width constraints

### State Management
- Uses localStorage with user-specific keys (`adminTimerState_${userId}`)
- Persists timer state across browser sessions
- Automatically cleans up expired timer states (24+ hours old)

### API Integration
- **Tasks API**: `/api/tasks?assignedTo=${userId}` - Fetches user's assigned tasks
- **Time Entries API**: `/api/time-entries` (POST) - Creates time entries
- **Auth API**: `/api/auth/me` - Validates user session

## Usage

### Starting a Timer
1. Click the "Start" button in the admin timer
2. If no task is selected, a task dropdown will appear
3. Select a task from the dropdown
4. Timer will start counting from 00:00:00

### Stopping a Timer
1. Click the "Stop" button while timer is running
2. Time entry will be automatically created and saved
3. Success message will be displayed
4. Timer will reset to 00:00:00

### Changing Tasks
- When timer is not running, click "Change task" to select a different task
- Task selection is only available when timer is stopped

## Design Considerations

### Compact Layout
- Optimized for sidebar placement (256px width)
- Uses smaller fonts and padding for space efficiency
- Maintains readability while being space-conscious

### Visual Hierarchy
- Clear timer display with monospace font
- Status indicators for running state
- Consistent with admin panel design language

### Accessibility
- Proper button states (disabled/enabled)
- Clear visual feedback for interactions
- Keyboard-accessible form controls

## Future Enhancements

Potential improvements that could be added:
- **Quick Start**: Pre-select most recent task
- **Timer Presets**: Common time durations (15min, 30min, 1hr)
- **Notes Field**: Add notes to time entries
- **Timer History**: Show recent timer sessions
- **Keyboard Shortcuts**: Start/stop with keyboard
- **Notifications**: Browser notifications for long sessions

## Troubleshooting

### Common Issues
1. **No tasks showing**: User may not have assigned tasks
2. **Timer not starting**: Check if user session is valid
3. **Time entry not saving**: Verify network connection and API endpoints

### Debug Information
- Timer state is stored in localStorage with key `adminTimerState_${userId}`
- Check browser console for any JavaScript errors
- Verify API responses in Network tab
