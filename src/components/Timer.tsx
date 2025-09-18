import React, { useState, useEffect } from 'react';
import { useRealtimeTimer } from '../utils/useRealtimeTimer';

interface Task {
  id: number;
  name: string;
  projectName: string;
  clientName: string;
  status: string;
  displayName?: string; // For system-generated tasks
}

export default function Timer() {
  // Real-time synchronized timer component that supports:
  // - Cross-device timer synchronization
  // - Server-side timer state management
  // - Real-time updates across all devices
  // - Automatic conflict resolution
  // - Toggle between dropdown and list-based task selection
  
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [localTime, setLocalTime] = useState(0);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'dropdown' | 'list'>('dropdown');
  const [curatedTaskList, setCuratedTaskList] = useState<number[]>([]);
  const [addTaskDropdownOpen, setAddTaskDropdownOpen] = useState(false);
  const [addTaskSearchTerm, setAddTaskSearchTerm] = useState('');
  const [contextMenuOpen, setContextMenuOpen] = useState<number | null>(null);
  const [weekDropdownOpen, setWeekDropdownOpen] = useState(false);
  const [dailyDurationTotals, setDailyDurationTotals] = useState<Array<{
    dayOfWeek: number;
    totalSeconds: number;
    hours: number;
    minutes: number;
    formatted: string;
  }>>([]);

  const [taskDailyTotals, setTaskDailyTotals] = useState<Array<{
    taskId: number;
    taskName: string;
    projectName: string;
    clientName: string;
    dayTotals: Array<{
      dayOfWeek: number;
      totalSeconds: number;
      hours: number;
      minutes: number;
      formatted: string;
    }>;
  }>>([]);

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, 1 = next week
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [selectedWeekEnd, setSelectedWeekEnd] = useState<Date | null>(null);

  // Compute week range (Sunday-Saturday) from an offset
  const computeWeekRange = (offset: number): { start: Date; end: Date } => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    const start = new Date(now);
    start.setDate(now.getDate() - daysToSubtract + offset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // Update selected week dates when offset changes
  useEffect(() => {
    const { start, end } = computeWeekRange(weekOffset);
    setSelectedWeekStart(start);
    setSelectedWeekEnd(end);
  }, [weekOffset]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.task-dropdown-container')) {
        setTaskDropdownOpen(false);
      }
      if (!target.closest('.add-task-dropdown-container')) {
        setAddTaskDropdownOpen(false);
      }
      if (!target.closest('.context-menu-container')) {
        setContextMenuOpen(null);
      }
      if (!target.closest('.week-dropdown-container')) {
        setWeekDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Use real-time timer hook for server synchronization
  const {
    timerData,
    isLoading: timerLoading,
    error: timerError,
    startTimer,
    stopTimer,
    forceStopTimer,
    refreshTimer
  } = useRealtimeTimer(2000); // Poll every 2 seconds

  // Calculate current time based on server data
  const time = timerData ? timerData.elapsedSeconds + localTime : 0;
  const isRunning = !!timerData;
  const startTime = timerData ? new Date(timerData.startTime) : null;

  // Check if the currently selected task still exists
  const validateSelectedTask = async () => {
    if (!selectedTask || !currentUserId) return;

    try {
      // Load all tasks using the reusable function
      await loadTasks();
      const currentTasks = tasks;
      
      // Check if the selected task still exists
      const taskExists = currentTasks.some((task: Task) => task.id === selectedTask);
      
      if (!taskExists && isRunning) {
        // Task was deleted while timer was running - stop the timer
        console.warn(`Task ${selectedTask} was deleted while timer was running. Stopping timer.`);
        
        // Stop the timer using the real-time system
        if (timerData) {
          await forceStopTimer(timerData.id);
        }
        
        setSelectedTask(null);
        
        // Task was deleted, timer stopped
      }
    } catch (error) {
      console.error('Error validating selected task:', error);
    }
  };

  // Load daily duration totals for the current week
  const loadDailyDurationTotals = async () => {
    if (!currentUserId) {
      console.log('loadDailyDurationTotals: No currentUserId, skipping');
      return;
    }

    // Require selected week range
    if (!selectedWeekStart || !selectedWeekEnd) {
      return;
    }

    console.log('loadDailyDurationTotals: Loading for userId:', currentUserId);
    try {
      const response = await fetch(`/api/reports/daily-duration-totals?userId=${currentUserId}&startDate=${encodeURIComponent(selectedWeekStart.toISOString())}&endDate=${encodeURIComponent(selectedWeekEnd.toISOString())}`);
      if (response.ok) {
        const data = await response.json();
        console.log('loadDailyDurationTotals: Received data:', data);
        console.log('loadDailyDurationTotals: weekTotals:', data.weekTotals);
        setDailyDurationTotals(data.weekTotals || []);
      } else {
        console.error('Failed to load daily duration totals:', response.status);
      }
    } catch (error) {
      console.error('Error loading daily duration totals:', error);
    }
  };

  // Load task-specific daily duration totals for the current week
  const loadTaskDailyTotals = async () => {
    if (!currentUserId) {
      console.log('loadTaskDailyTotals: No currentUserId, skipping');
      return;
    }

    if (!selectedWeekStart || !selectedWeekEnd) {
      return;
    }

    console.log('loadTaskDailyTotals: Loading for userId:', currentUserId);
    try {
      const response = await fetch(`/api/reports/task-daily-totals?userId=${currentUserId}&startDate=${encodeURIComponent(selectedWeekStart.toISOString())}&endDate=${encodeURIComponent(selectedWeekEnd.toISOString())}`);
      if (response.ok) {
        const data = await response.json();
        console.log('loadTaskDailyTotals: Received data:', data);
        console.log('loadTaskDailyTotals: taskDailyData:', data.taskDailyData);
        setTaskDailyTotals(data.taskDailyData || []);
      } else {
        console.error('Failed to load task daily totals:', response.status);
      }
    } catch (error) {
      console.error('Error loading task daily totals:', error);
    }
  };

  // Load all tasks (regular and system tasks) with retry logic
  const loadTasks = async (retryCount = 0) => {
    if (!currentUserId) {
      console.log('loadTasks: No currentUserId, skipping');
      return;
    }

    console.log('loadTasks: Loading tasks for userId:', currentUserId, 'retry:', retryCount);
    try {
      // Load both regular tasks and system tasks in parallel with timeout
      const [regularTasksResponse, systemTasksResponse] = await Promise.allSettled([
        fetch(`/api/tasks?assignedTo=${currentUserId}`, { 
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }),
        fetch(`/api/system-tasks?assignedTo=${currentUserId}&limit=100`, { 
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
      ]);

      let regularTasks = [];
      let systemTasks = [];

      // Handle regular tasks response
      if (regularTasksResponse.status === 'fulfilled' && regularTasksResponse.value.ok) {
        const tasksData = await regularTasksResponse.value.json();
        regularTasks = tasksData.data || [];
        console.log('loadTasks: Loaded', regularTasks.length, 'regular tasks');
      } else {
        console.error('Failed to load regular tasks:', regularTasksResponse.status === 'rejected' ? regularTasksResponse.reason : regularTasksResponse.value?.status);
      }

      // Handle system tasks response
      if (systemTasksResponse.status === 'fulfilled' && systemTasksResponse.value.ok) {
        const systemTasksData = await systemTasksResponse.value.json();
        systemTasks = systemTasksData.data || [];
        console.log('loadTasks: Loaded', systemTasks.length, 'system tasks');
      } else {
        console.error('Failed to load system tasks:', systemTasksResponse.status === 'rejected' ? systemTasksResponse.reason : systemTasksResponse.value?.status);
      }

      // Combine regular tasks and system tasks
      const allTasks = [...regularTasks, ...systemTasks];
      setTasks(allTasks);
      console.log('loadTasks: Total loaded', allTasks.length, 'tasks');

      // If no tasks were loaded and this is the first attempt, retry once
      if (allTasks.length === 0 && retryCount === 0) {
        console.log('loadTasks: No tasks loaded, retrying in 1 second...');
        setTimeout(() => loadTasks(1), 1000);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Retry once if this is the first attempt
      if (retryCount === 0) {
        console.log('loadTasks: Error occurred, retrying in 2 seconds...');
        setTimeout(() => loadTasks(1), 2000);
      }
    }
  };

  // Initialize component and load user data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load layout preferences from localStorage
        const savedLayoutMode = localStorage.getItem('timerLayoutMode') as 'dropdown' | 'list' | null;
        if (savedLayoutMode) {
          setLayoutMode(savedLayoutMode);
          // Dispatch event to notify dashboard of initial layout mode
          window.dispatchEvent(new CustomEvent('timerLayoutModeChanged', {
            detail: { mode: savedLayoutMode }
          }));
        }

        // Get current user
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            const userId = userData.user.id;
            setCurrentUserId(userId);
            
            // Load curated task list from server, fallback to localStorage
            try {
              const taskListResponse = await fetch('/api/user-task-lists');
              if (taskListResponse.ok) {
                const taskListData = await taskListResponse.json();
                if (taskListData.success) {
                  setCuratedTaskList(taskListData.data || []);
                } else {
                  // Fallback to localStorage if API fails
                  const savedCuratedList = localStorage.getItem(`curatedTaskList_${userId}`);
                  if (savedCuratedList) {
                    try {
                      const parsedList = JSON.parse(savedCuratedList);
                      setCuratedTaskList(parsedList);
                    } catch (error) {
                      console.error('Error parsing curated task list from localStorage:', error);
                    }
                  }
                }
              } else {
                // Fallback to localStorage if API fails
                const savedCuratedList = localStorage.getItem(`curatedTaskList_${userId}`);
                if (savedCuratedList) {
                  try {
                    const parsedList = JSON.parse(savedCuratedList);
                    setCuratedTaskList(parsedList);
                  } catch (error) {
                    console.error('Error parsing curated task list from localStorage:', error);
                  }
                }
              }
            } catch (error) {
              console.error('Error loading curated task list from server:', error);
              // Fallback to localStorage
              const savedCuratedList = localStorage.getItem(`curatedTaskList_${userId}`);
              if (savedCuratedList) {
                try {
                  const parsedList = JSON.parse(savedCuratedList);
                  setCuratedTaskList(parsedList);
                } catch (error) {
                  console.error('Error parsing curated task list from localStorage:', error);
                }
              }
            }
            
            // Load tasks using the reusable function
            await loadTasks();
            
            // Load daily duration totals (will be called again when currentUserId is set)
            // await loadDailyDurationTotals();
          }
        }
      } catch (error) {
        console.error('Error initializing timer data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    initializeData();
  }, []);

  // Reload tasks when currentUserId changes (in case it's set after initial load)
  useEffect(() => {
    if (currentUserId) {
      console.log('currentUserId changed, reloading tasks:', currentUserId);
      loadTasks();
    }
  }, [currentUserId]);

  // Load daily duration totals when currentUserId or selected week range changes
  useEffect(() => {
    if (currentUserId && selectedWeekStart && selectedWeekEnd) {
      loadDailyDurationTotals();
      loadTaskDailyTotals();
    }
  }, [currentUserId, selectedWeekStart?.getTime(), selectedWeekEnd?.getTime()]);

  // Update selected task when timer data changes
  useEffect(() => {
    if (timerData && timerData.task) {
      setSelectedTask(timerData.taskId);
      // Update search term to show the selected task
      const task = tasks.find(t => t.id === timerData.taskId);
      if (task) {
        setTaskSearchTerm(task.displayName || `${task.projectName} - ${task.name}`);
      }
    }
  }, [timerData, tasks]);

  // Local time counter for smooth display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setLocalTime(prev => prev + 1);
      }, 1000);
    } else {
      setLocalTime(0);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Reset local time when server data updates
  useEffect(() => {
    if (timerData) {
      setLocalTime(0);
    }
  }, [timerData?.elapsedSeconds]);





  // Listen for task deletion events
  useEffect(() => {
    const handleTaskDeleted = (event: CustomEvent) => {
      const deletedTaskId = event.detail?.taskId;
      if (deletedTaskId && deletedTaskId === selectedTask && isRunning) {
        console.warn(`Task ${deletedTaskId} was deleted. Stopping timer.`);
        
        // Stop the timer using the real-time system
        if (timerData) {
          forceStopTimer(timerData.id);
        }
        
        setSelectedTask(null);
        
        // Task was deleted, timer stopped
      }
    };

    // Listen for custom task deletion events
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);
    
    return () => {
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
    };
  }, [selectedTask, isRunning, currentUserId, timerData, forceStopTimer]);

  // Close dropdown when timer starts
  useEffect(() => {
    if (isRunning) {
      setTaskDropdownOpen(false);
    }
  }, [isRunning]);

  // Listen for timer events to refresh timer state and daily totals
  useEffect(() => {
    const handleTimerStopped = () => {
      // Refresh timer state immediately when timer is stopped from elsewhere
      refreshTimer();
      // Also refresh tasks and daily duration totals
      loadTasks();
      loadDailyDurationTotals();
      loadTaskDailyTotals();
    };

    const handleTimerStarted = () => {
      // Refresh timer state when timer is started from elsewhere
      refreshTimer();
      // Also refresh tasks and daily duration totals (in case of manual entries)
      loadTasks();
      loadDailyDurationTotals();
      loadTaskDailyTotals();
    };

    const handleTimeEntryChanged = () => {
      // Refresh tasks, daily duration totals, and task daily totals when time entries are added/updated/deleted
      loadTasks();
      loadDailyDurationTotals();
      loadTaskDailyTotals();
    };

    window.addEventListener('timerStopped', handleTimerStopped);
    window.addEventListener('timerStarted', handleTimerStarted);
    window.addEventListener('timeEntryAdded', handleTimeEntryChanged);
    window.addEventListener('timeEntryUpdated', handleTimeEntryChanged);
    window.addEventListener('timeEntryDeleted', handleTimeEntryChanged);
    
    return () => {
      window.removeEventListener('timerStopped', handleTimerStopped);
      window.removeEventListener('timerStarted', handleTimerStarted);
      window.removeEventListener('timeEntryAdded', handleTimeEntryChanged);
      window.removeEventListener('timeEntryUpdated', handleTimeEntryChanged);
      window.removeEventListener('timeEntryDeleted', handleTimeEntryChanged);
    };
  }, [refreshTimer]);

  // Periodic refresh of tasks and daily totals to ensure they stay up-to-date
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUserId) {
        loadTasks();
        loadDailyDurationTotals();
        loadTaskDailyTotals();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [currentUserId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!selectedTask) {
      return;
    }
    if (!currentUserId) {
      return;
    }

    // If there's already a timer running, stop it first
    if (isRunning && timerData) {
      console.log('Stopping current timer before starting new one');
      const stopSuccess = await stopTimer(timerData.id);
      if (!stopSuccess) {
        console.error('Failed to stop current timer');
        return;
      }
    }

    const success = await startTimer(selectedTask);
    if (success) {
      // Automatically add the task to the curated list if it's not already there
      if (!curatedTaskList.includes(selectedTask)) {
        await addToCuratedList(selectedTask);
      }
      
      // Close the dropdown when timer starts
      setTaskDropdownOpen(false);
      // Trigger a custom event to notify the dashboard to refresh
      window.dispatchEvent(new CustomEvent('timerStarted'));
    }
  };

  const handleStopTimer = async () => {
    if (!timerData) {
      return;
    }

    const success = await stopTimer(timerData.id);
    if (success) {
      // Trigger a page refresh to update the recent entries
      window.location.reload();
    }
  };

  const handleForceStopTimer = async () => {
    if (!timerData) {
      return;
    }

    if (confirm('This will force stop the timer without saving. Are you sure?')) {
      const success = await forceStopTimer(timerData.id);
      if (success) {
        // Timer force stopped successfully
      }
    }
  };

  // Handle layout mode toggle
  const handleLayoutModeToggle = (mode: 'dropdown' | 'list') => {
    setLayoutMode(mode);
    localStorage.setItem('timerLayoutMode', mode);
    
    // Dispatch custom event to notify dashboard of layout change
    window.dispatchEvent(new CustomEvent('timerLayoutModeChanged', {
      detail: { mode }
    }));
  };

  // Add task to curated list
  const addToCuratedList = async (taskId: number) => {
    if (!curatedTaskList.includes(taskId)) {
      try {
        const response = await fetch('/api/user-task-lists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId }),
        });

        if (response.ok) {
          const newList = [...curatedTaskList, taskId];
          setCuratedTaskList(newList);
        } else {
          console.error('Failed to add task to list via API, falling back to localStorage');
          // Fallback to localStorage
          const newList = [...curatedTaskList, taskId];
          setCuratedTaskList(newList);
          if (currentUserId) {
            localStorage.setItem(`curatedTaskList_${currentUserId}`, JSON.stringify(newList));
          }
        }
      } catch (error) {
        console.error('Error adding task to list via API, falling back to localStorage:', error);
        // Fallback to localStorage
        const newList = [...curatedTaskList, taskId];
        setCuratedTaskList(newList);
        if (currentUserId) {
          localStorage.setItem(`curatedTaskList_${currentUserId}`, JSON.stringify(newList));
        }
      }
    }
  };

  // Remove task from curated list
  const removeFromCuratedList = async (taskId: number) => {
    try {
      const response = await fetch('/api/user-task-lists', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        const newList = curatedTaskList.filter(id => id !== taskId);
        setCuratedTaskList(newList);
      } else {
        console.error('Failed to remove task from list via API, falling back to localStorage');
        // Fallback to localStorage
        const newList = curatedTaskList.filter(id => id !== taskId);
        setCuratedTaskList(newList);
        if (currentUserId) {
          localStorage.setItem(`curatedTaskList_${currentUserId}`, JSON.stringify(newList));
        }
      }
    } catch (error) {
      console.error('Error removing task from list via API, falling back to localStorage:', error);
      // Fallback to localStorage
      const newList = curatedTaskList.filter(id => id !== taskId);
      setCuratedTaskList(newList);
      if (currentUserId) {
        localStorage.setItem(`curatedTaskList_${currentUserId}`, JSON.stringify(newList));
      }
    }
  };

  // Delete task and all weekly entries
  const deleteTaskAndWeeklyEntries = async (taskId: number) => {
    try {
      // Calculate current week (Sunday to Saturday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - currentDay); // Go back to Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      // Delete all time entries for this task in the current week
      const deleteEntriesResponse = await fetch('/api/time-entries', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString()
        }),
      });

      if (!deleteEntriesResponse.ok) {
        console.error('Failed to delete time entries for task');
      }

      // Remove task from curated list
      await removeFromCuratedList(taskId);
      
      // Close context menu
      setContextMenuOpen(null);
      
      // Refresh timer data to update any running timers
      if (refreshTimer) {
        refreshTimer();
      }
    } catch (error) {
      console.error('Error deleting task and weekly entries:', error);
    }
  };

  // Get curated tasks
  const getCuratedTasks = () => {
    return tasks.filter(task => curatedTaskList.includes(task.id));
  };

  // Get tasks with entries in the current week (including running timers and curated tasks)
  const getTasksWithCurrentWeekEntries = () => {
    const tasksWithEntries = taskDailyTotals
      .filter(taskData => {
        // Check if any day has time entries (totalSeconds > 0)
        return taskData.dayTotals.some(day => day.totalSeconds > 0);
      })
      .map(taskData => {
        // Find the corresponding task from the tasks array, or create a task object from taskDailyTotals data
        const task = tasks.find(task => task.id === taskData.taskId);
        if (task) {
          return task;
        } else {
          // If task not found in tasks array, create a task object from taskDailyTotals data
          return {
            id: taskData.taskId,
            name: taskData.taskName,
            projectName: taskData.projectName,
            clientName: taskData.clientName,
            displayName: `${taskData.projectName} - ${taskData.taskName}`,
            description: '',
            status: 'active',
            archived: false,
            createdAt: new Date(),
            updatedAt: new Date()
          } as Task;
        }
      })
      .filter(task => task !== undefined); // Remove undefined entries

    // For current week, include extras; for other weeks, show only tasks with entries
    if (weekOffset === 0) {
      // Add running timer task if it's not already in the list
      if (isRunning && selectedTask) {
        const runningTask = tasks.find(task => task.id === selectedTask);
        if (runningTask && !tasksWithEntries.some(task => task.id === selectedTask)) {
          tasksWithEntries.push(runningTask);
        }
      }

      // Add curated tasks that don't have time entries yet
      const curatedTasks = tasks.filter(task => curatedTaskList.includes(task.id));
      curatedTasks.forEach(curatedTask => {
        if (!tasksWithEntries.some(task => task.id === curatedTask.id)) {
          tasksWithEntries.push(curatedTask);
        }
      });
    }

    return tasksWithEntries;
  };

  // Get real-time daily totals for a task (including running timer)
  const getRealTimeDailyTotals = (taskId: number) => {
    // Get the base daily totals from taskDailyTotals
    const baseTaskData = taskDailyTotals.find(t => t.taskId === taskId);
    const dayTotals = baseTaskData ? [...baseTaskData.dayTotals] : [];
    
    // If no base data exists, create empty day totals
    if (dayTotals.length === 0) {
      for (let i = 0; i < 7; i++) {
        dayTotals.push({
          dayOfWeek: i,
          totalSeconds: 0,
          hours: 0,
          minutes: 0,
          formatted: '0h 0m'
        });
      }
    }
    
    // If viewing current week and this task has a running timer, add live time to today's total
    if (weekOffset === 0 && isRunning && selectedTask === taskId && timerData) {
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate current session time
      const currentSessionSeconds = timerData.elapsedSeconds + localTime;
      
      // Add to today's total
      const todayIndex = dayTotals.findIndex(day => day.dayOfWeek === today);
      if (todayIndex !== -1) {
        const newTotalSeconds = dayTotals[todayIndex].totalSeconds + currentSessionSeconds;
        const hours = Math.floor(newTotalSeconds / 3600);
        const minutes = Math.floor((newTotalSeconds % 3600) / 60);
        
        dayTotals[todayIndex] = {
          dayOfWeek: today,
          totalSeconds: newTotalSeconds,
          hours,
          minutes,
          formatted: `${hours}h ${minutes}m`
        };
      }
    }
    
    return dayTotals;
  };

  // Organize tasks with current week entries by client
  const organizeTasksWithEntriesByClient = () => {
    const tasksWithEntries = getTasksWithCurrentWeekEntries();
    const clientGroups: { [clientName: string]: Task[] } = {};
    
    tasksWithEntries.forEach(task => {
      const clientName = task.clientName;
      if (!clientGroups[clientName]) {
        clientGroups[clientName] = [];
      }
      clientGroups[clientName].push(task);
    });
    
    // Sort clients alphabetically
    const sortedClients = Object.keys(clientGroups).sort();
    
    // For each client, sort tasks: General task first, then other tasks alphabetically
    sortedClients.forEach(clientName => {
      clientGroups[clientName].sort((a, b) => {
        // Put General tasks first
        if (a.name === 'General' && b.name !== 'General') return -1;
        if (a.name !== 'General' && b.name === 'General') return 1;
        
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      });
    });
    
    return { clientGroups, sortedClients };
  };

  // Handle start timer for specific task (used in list view)
  const handleStartTimerForTask = async (taskId: number) => {
    if (!currentUserId) {
      return;
    }

    // If there's already a timer running, stop it first
    if (isRunning && timerData) {
      console.log('Stopping current timer before starting new one');
      const stopSuccess = await stopTimer(timerData.id);
      if (!stopSuccess) {
        console.error('Failed to stop current timer');
        return;
      }
    }

    setSelectedTask(taskId);
    const success = await startTimer(taskId);
    if (success) {
      // Automatically add the task to the curated list if it's not already there
      if (!curatedTaskList.includes(taskId)) {
        await addToCuratedList(taskId);
      }
      
      // Trigger a custom event to notify the dashboard to refresh
      window.dispatchEvent(new CustomEvent('timerStarted'));
    }
  };

  // Handle adding task from search dropdown
  const handleAddTaskFromSearch = async (taskId: number) => {
    await addToCuratedList(taskId);
    setAddTaskDropdownOpen(false);
    setAddTaskSearchTerm('');
  };



  // Get task name for display
  const getSelectedTaskName = () => {
    if (!selectedTask) return '';
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return '';
    
    // Use displayName for system-generated tasks, otherwise use project - task format
    return task.displayName || `${task.projectName} - ${task.name}`;
  };

  // Get client name for display
  const getSelectedTaskClientName = () => {
    if (!selectedTask) return '';
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return '';
    
    return task.clientName;
  };

  // Organize tasks by client for dropdown display
  const organizeTasksByClient = () => {
    const clientGroups: { [clientName: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const clientName = task.clientName;
      if (!clientGroups[clientName]) {
        clientGroups[clientName] = [];
      }
      clientGroups[clientName].push(task);
    });
    
    // Sort clients alphabetically
    const sortedClients = Object.keys(clientGroups).sort();
    
    // For each client, sort tasks: General task first, then other tasks alphabetically
    sortedClients.forEach(clientName => {
      clientGroups[clientName].sort((a, b) => {
        // Put General tasks first
        if (a.name === 'General' && b.name !== 'General') return -1;
        if (a.name !== 'General' && b.name === 'General') return 1;
        
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      });
    });
    
    return { clientGroups, sortedClients };
  };

  // Filter tasks based on search term
  const getFilteredTasks = (searchTerm?: string) => {
    const currentSearchTerm = searchTerm || taskSearchTerm;
    
    if (!currentSearchTerm.trim()) {
      return organizeTasksByClient();
    }
    
    const searchLower = currentSearchTerm.toLowerCase();
    const filteredTasks = tasks.filter(task => 
      task.clientName.toLowerCase().includes(searchLower) ||
      task.projectName.toLowerCase().includes(searchLower) ||
      task.name.toLowerCase().includes(searchLower) ||
      (task.displayName && task.displayName.toLowerCase().includes(searchLower))
    );
    
    const clientGroups: { [clientName: string]: Task[] } = {};
    filteredTasks.forEach(task => {
      const clientName = task.clientName;
      if (!clientGroups[clientName]) {
        clientGroups[clientName] = [];
      }
      clientGroups[clientName].push(task);
    });
    
    const sortedClients = Object.keys(clientGroups).sort();
    
    sortedClients.forEach(clientName => {
      clientGroups[clientName].sort((a, b) => {
        if (a.name === 'General' && b.name !== 'General') return -1;
        if (a.name !== 'General' && b.name === 'General') return 1;
        return a.name.localeCompare(b.name);
      });
    });
    
    return { clientGroups, sortedClients };
  };

  // Render the task dropdown
  const renderTaskDropdown = () => {
    const { clientGroups, sortedClients } = getFilteredTasks();
    
    if (sortedClients.length === 0) {
      return (
        <div className="px-4 py-2 text-gray-500 text-sm">
          {taskSearchTerm.trim() ? 'No tasks found' : 'No tasks assigned'}
        </div>
      );
    }
    
    return (
      <div>
        {sortedClients.map((clientName, clientIndex) => (
          <div key={clientName}>
            {/* Client Header */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {clientName}
            </div>
            
            {/* Tasks for this client */}
            {clientGroups[clientName].map((task, taskIndex) => (
              <div
                key={task.id}
                className="pl-8 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                onClick={() => {
                  setSelectedTask(task.id);
                  setTaskSearchTerm(task.displayName || `${task.projectName} - ${task.name}`);
                  setTaskDropdownOpen(false);
                }}
              >
                <div className="font-medium text-gray-900">
                  {task.displayName || `${task.projectName} - ${task.name}`}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Render the add task dropdown
  const renderAddTaskDropdown = () => {
    const { clientGroups, sortedClients } = getFilteredTasks(addTaskSearchTerm);
    
    if (sortedClients.length === 0) {
      return (
        <div className="px-4 py-2 text-gray-500 text-sm">
          {addTaskSearchTerm.trim() ? 'No tasks found' : 'No tasks assigned'}
        </div>
      );
    }
    
    return (
      <div>
        {sortedClients.map((clientName, clientIndex) => (
          <div key={clientName}>
            {/* Client Header */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {clientName}
            </div>
            
            {/* Tasks for this client */}
            {clientGroups[clientName].map((task, taskIndex) => {
              const isAlreadyAdded = curatedTaskList.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`pl-8 py-2 text-sm border-b border-gray-100 last:border-b-0 ${
                    isAlreadyAdded 
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                      : 'hover:bg-gray-100 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isAlreadyAdded) {
                      handleAddTaskFromSearch(task.id);
                    }
                  }}
                >
                  <div className="font-medium text-gray-900 flex items-center justify-between">
                    <span>
                      {task.displayName || `${task.projectName} - ${task.name}`}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-xs text-gray-500">Added</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Render the list-based layout
  const renderTaskList = () => {
    const { clientGroups, sortedClients } = organizeTasksWithEntriesByClient();
    
    return (
      <div className="space-y-4">
        {/* Timer Display and Add Task Button Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Timer Display */}
          <div 
            className="text-[2.5rem] text-black"
            style={{ 
              fontFamily: 'RadiolandTest, monospace',
              fontWeight: 'bold',
              fontStyle: 'normal'
            }}
          >
            {formatTime(time)}
          </div>
          
          {/* Add Task and Quick Entry Buttons (only for current week) */}
          {weekOffset === 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAddTaskDropdownOpen(!addTaskDropdownOpen)}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Add Task</span>
              </button>
              
              <button
                onClick={() => {
                  // Trigger the existing add time entry modal
                  const addTimeEntryBtn = document.getElementById('addTimeEntryBtn');
                  if (addTimeEntryBtn) {
                    addTimeEntryBtn.click();
                  }
                }}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                <svg fill="currentColor" viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier"> 
                    <path d="M23,18H20V15a1,1,0,0,0-2,0v3H15a1,1,0,0,0,0,2h3v3a1,1,0,0,0,2,0V20h3a1,1,0,0,0,0-2Z M11,7v4.586L8.293,14.293a1,1,0,1,0,1.414,1.414l3-3A1,1,0,0,0,13,12V7a1,1,0,0,0-2,0Z M14.728,21.624a9.985,9.985,0,1,1,6.9-6.895,1,1,0,1,0,1.924.542,11.989,11.989,0,1,0-8.276,8.277,1,1,0,1,0-.544-1.924Z"></path>
                  </g>
                </svg>
                <span>Quick Entry</span>
              </button>
            </div>
          )}
        </div>

        {/* Week Navigation (full width, centered range picker) */}
        <div className="w-full grid grid-cols-3 items-center">
          {/* Left: Prev */}
          <div className="justify-self-start">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              ◀ Prev Week
            </button>
          </div>

          {/* Center: Date range dropdown button */}
          <div className="justify-self-center text-center">
            <div className="relative inline-block week-dropdown-container">
              <button
                onClick={() => setWeekDropdownOpen(prev => !prev)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center space-x-2"
              >
                <span>
                  {selectedWeekStart && selectedWeekEnd && (
                    <>{selectedWeekStart.toLocaleDateString()} - {selectedWeekEnd.toLocaleDateString()}</>
                  )}
                </span>
                <svg className={`w-4 h-4 transition-transform ${weekDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {weekDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 z-50 mt-1 w-64 bg-white border border-gray-300 rounded shadow-lg overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    {[...Array(12)].map((_, idx) => {
                      const offset = -idx; // absolute offsets: 0 current, -1 prev, etc.
                      const { start, end } = computeWeekRange(offset);
                      const label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                      const isCurrent = offset === weekOffset;
                      return (
                        <button
                          key={idx}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${isCurrent ? 'bg-gray-50' : ''}`}
                          onClick={() => { setWeekOffset(offset); setWeekDropdownOpen(false); }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Next */}
          <div className="justify-self-end">
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Next Week ▶
            </button>
          </div>
        </div>

        {/* Curated Task List */}
        <div>

          {/* Add Task Search Dropdown */}
          {weekOffset === 0 && addTaskDropdownOpen && (
            <div className="mb-4 relative add-task-dropdown-container">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search tasks to add..."
                  value={addTaskSearchTerm}
                  onChange={(e) => setAddTaskSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="fill-current h-5 w-5 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              
              {/* Add Task Dropdown */}
              <div 
                className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden mt-1" 
                style={{ 
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}
              >
                {renderAddTaskDropdown()}
              </div>
            </div>
          )}

          {sortedClients.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-xl">📝</span>
              </div>
              <p className="text-gray-500 text-sm">No tasks with time entries for this week</p>
              {weekOffset === 0 && (
                <p className="text-gray-400 text-xs mt-1">Click "Add Task" to get started</p>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <div className="w-80 flex-shrink-0">Task</div>
                  <div className="flex-1 text-center">Sun</div>
                  <div className="flex-1 text-center">Mon</div>
                  <div className="flex-1 text-center">Tues</div>
                  <div className="flex-1 text-center">Wed</div>
                  <div className="flex-1 text-center">Thurs</div>
                  <div className="flex-1 text-center">Fri</div>
                  <div className="flex-1 text-center">Sat</div>
                  <div className="flex-1 text-center font-semibold">Total</div>
                </div>
                {/* Daily Duration Totals */}
                <div className="flex px-4 pb-3 text-xs text-gray-500">
                  <div className="w-80 flex-shrink-0"></div>
                  {(() => {
                    console.log('dailyDurationTotals state:', dailyDurationTotals);
                    console.log('dailyDurationTotals.length:', dailyDurationTotals.length);
                    
                    let totalSeconds = 0;
                    const dayElements = dailyDurationTotals.length > 0 ? dailyDurationTotals.map((dayTotal, index) => {
                      console.log('Rendering day total:', index, dayTotal);
                      totalSeconds += dayTotal.totalSeconds;
                      return (
                        <div key={index} className="flex-1 text-center">
                          {dayTotal.totalSeconds > 0 ? dayTotal.formatted : '-'}
                        </div>
                      );
                    }) : (
                      // Show placeholder when no data is loaded yet
                      <>
                        <div className="flex-1 text-center">-</div>
                        <div className="flex-1 text-center">-</div>
                        <div className="flex-1 text-center">-</div>
                        <div className="flex-1 text-center">-</div>
                        <div className="flex-1 text-center">-</div>
                        <div className="flex-1 text-center">-</div>
                        <div className="flex-1 text-center">-</div>
                      </>
                    );
                    
                    // Calculate total hours and minutes
                    const totalHours = Math.floor(totalSeconds / 3600);
                    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
                    const totalFormatted = totalSeconds > 0 ? `${totalHours}h ${totalMinutes}m` : '-';
                    
                    return (
                      <>
                        {dayElements}
                        <div className="flex-1 text-center font-semibold text-gray-700">
                          {totalFormatted}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {sortedClients.map((clientName, clientIndex) => (
                  <div key={clientName}>
                    {/* Client Header */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {clientName}
                    </div>
                    
                    {/* Tasks for this client */}
                    {clientGroups[clientName].map((task, taskIndex) => {
                  const isCurrentlyRunning = isRunning && selectedTask === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`px-4 py-4 transition-all ${
                        isCurrentlyRunning
                          ? 'bg-green-50'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {/* Task Column */}
                        <div className="w-80 flex-shrink-0">
                          <div className="flex items-center space-x-3">
                            {/* Start/Stop Button */}
                            <div className="flex-shrink-0">
                              {isCurrentlyRunning ? (
                                <button
                                  onClick={handleStopTimer}
                                  disabled={timerLoading}
                                  className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                                  title="Stop timer"
                                >
                                  {timerLoading ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <rect x="6" y="6" width="12" height="12"/>
                                    </svg>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartTimerForTask(task.id)}
                                  disabled={timerLoading}
                                  className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full hover:bg-green-500 hover:text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                                  title="Start timer"
                                >
                                  {timerLoading ? (
                                    <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Task Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-600 truncate">
                                {task.displayName || `${task.projectName} - ${task.name}`}
                              </div>
                            </div>

                            {/* Context Menu Button */}
                            <div className="relative context-menu-container">
                              <button
                                onClick={() => setContextMenuOpen(contextMenuOpen === task.id ? null : task.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="More options"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                              </button>
                              
                              {/* Context Menu */}
                              {contextMenuOpen === task.id && (
                                <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                                  <button
                                    onClick={() => deleteTaskAndWeeklyEntries(task.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    <span>Delete row</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Day Columns - Real-Time Daily Totals */}
                        {(() => {
                          const realTimeDayTotals = getRealTimeDailyTotals(task.id);
                          let totalSeconds = 0;
                          const dayElements = realTimeDayTotals.map((dayTotal, dayIndex) => {
                            totalSeconds += dayTotal.totalSeconds;
                            const isToday = new Date().getDay() === dayTotal.dayOfWeek;
                            const isRunningToday = isRunning && selectedTask === task.id && isToday;
                            
                            return (
                              <div 
                                key={dayIndex} 
                                className={`flex-1 text-center text-sm ${
                                  isRunningToday 
                                    ? 'text-green-600 font-semibold' 
                                    : dayTotal.totalSeconds > 0 
                                      ? 'text-gray-600' 
                                      : 'text-gray-400'
                                }`}
                              >
                                {dayTotal.totalSeconds > 0 ? dayTotal.formatted : '-'}
                              </div>
                            );
                          });
                          
                          // Calculate total hours and minutes
                          const totalHours = Math.floor(totalSeconds / 3600);
                          const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
                          const totalFormatted = totalSeconds > 0 ? `${totalHours}h ${totalMinutes}m` : '-';
                          const isRunningTask = isRunning && selectedTask === task.id;
                          
                          return (
                            <>
                              {dayElements}
                              <div className={`flex-1 text-center text-sm font-semibold ${
                                isRunningTask ? 'text-green-600' : 'text-gray-700'
                              }`}>
                                {totalFormatted}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // Show loading state while data is being loaded
  if (dataLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Tracker</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timer data...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if no user is logged in
  if (!currentUserId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Tracker</h2>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-xl">🔒</span>
          </div>
          <p className="text-gray-600 mb-2">Authentication Required</p>
          <p className="text-gray-500 text-sm">Please sign in to access the time tracker.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Time Tracker</h2>
        
        {/* Layout Toggle */}
        <div className="flex items-center space-x-2">
          {/* <span className="text-sm text-gray-600">View:</span> */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleLayoutModeToggle('dropdown')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                layoutMode === 'dropdown'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier"> 
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 20C15.866 20 19 16.866 19 13C19 11.0824 18.229 9.34498 16.98 8.08071L18.1872 6.87353L17.1265 5.81287L15.8116 7.12778C14.9125 6.54298 13.8708 6.15908 12.7499 6.0397V4.5H15V3H9V4.5H11.2499V6.03971C10.1292 6.1591 9.08749 6.54298 8.18844 7.12773L6.87352 5.81281L5.81286 6.87347L7.02004 8.08065C5.77106 9.34493 5 11.0824 5 13C5 16.866 8.13401 20 12 20ZM12 7.5C8.96243 7.5 6.5 9.96243 6.5 13C6.5 16.0376 8.96243 18.5 12 18.5C15.0376 18.5 17.5 16.0376 17.5 13C17.5 9.96243 15.0376 7.5 12 7.5Z" fill="currentColor"></path> 
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.5 12.5V8.99988H11V14H15V12.5H12.5Z" fill="currentColor"></path> 
                </g>
              </svg>
            </button>
            <button
              onClick={() => handleLayoutModeToggle('list')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                layoutMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="#000000" height="200px" width="200px" version="1.1" id="XMLID_209_" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" xmlSpace="preserve"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="schedule"> <g> <path d="M24,24H0V3h5V0h2v3h10V0h2v3h5V24z M2,22h20V5H2v3h20v2H2V22z M20,19H8v-2h12V19z M6,19H4v-2h2V19z M20,15H8v-2h12V15z M6,15H4v-2h2V15z"></path> </g> </g> </g></svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Task Selection - Dropdown Layout */}
      {layoutMode === 'dropdown' && !isRunning && (
        <div className="mb-6 relative task-dropdown-container">
          <label htmlFor="taskSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Task
          </label>
          <div className="relative">
            <input
              type="text"
              id="taskSelect"
              placeholder="🔍 Search tasks..."
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              onFocus={() => {
                setTaskDropdownOpen(true);
                // Clear search term when opening dropdown to show all tasks
                if (selectedTask) {
                  setTaskSearchTerm('');
                }
              }}
              onClick={() => {
                setTaskDropdownOpen(true);
                // Clear search term when clicking to show all tasks
                if (selectedTask) {
                  setTaskSearchTerm('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="fill-current h-5 w-5 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          
          {/* Task Dropdown */}
          {taskDropdownOpen && (
            <div 
              className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden" 
              style={{ 
                top: '100%', 
                left: 0, 
                maxHeight: '240px',
                overflowY: 'auto'
              }}
            >
              {renderTaskDropdown()}
            </div>
          )}
          
          {tasks.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No tasks assigned. Contact your manager.</p>
          )}
        </div>
      )}

      {/* Task Selection - List Layout */}
      {layoutMode === 'list' && (
        <div className="mb-6">
          {renderTaskList()}
        </div>
      )}


      {/* Currently tracking box - show in dropdown mode when timer is running */}
      {layoutMode === 'dropdown' && isRunning && selectedTask && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm font-medium text-gray-900">Currently tracking:</p>
          <p className="text-lg font-medium text-gray-800">{getSelectedTaskClientName()}</p>
          <p className="text-sm text-gray-700">{getSelectedTaskName()}</p>
          <p className="text-xs text-gray-600 mt-1">
            Started at: {startTime?.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Timer Display - Only show in dropdown mode */}
      {layoutMode === 'dropdown' && (
        <div 
          className="text-[3rem] text-center mb-6 text-black"
          style={{ 
            fontFamily: 'RadiolandTest, monospace',
            fontWeight: 'bold',
            fontStyle: 'normal',
            marginTop: '3rem'
          }}
        >
          {formatTime(time)}
        </div>
      )}

      {/* Timer Controls - Only show in dropdown mode */}
      {layoutMode === 'dropdown' && (
        <div className="flex space-x-2 justify-center">
          {!isRunning ? (
            <button
              onClick={handleStartTimer}
              disabled={!selectedTask || timerLoading || !currentUserId}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                !selectedTask || timerLoading || !currentUserId
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'text-white hover:bg-green-600'
              }`}
              style={{
                backgroundColor: !selectedTask || timerLoading || !currentUserId ? '#D1D5DB' : '#49D449'
              }}
            >
              {timerLoading ? 'Starting...' : 'Start'}
            </button>
          ) : (
            <>
              <button
                onClick={handleStopTimer}
                disabled={timerLoading}
                className={`flex-1 flex row items-center justify-center px-3 py-2 text-lg font-medium rounded transition-colors border-0 ${
                  timerLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {timerLoading ? 'Stopping...' : (
                  <>
                    Stop
                    <svg viewBox="0 0 24 24" className="w-6 h-6 ml-1" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M4 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12z" fill="#ffffff"></path>
                        </g>
                    </svg>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}


      {/* Status */}
      {isRunning && (
        <div className="mt-4 text-center">
          <div 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium uppercase text-[#00c64e]"
            style={{
              backgroundColor: 'rgb(240 238 245)'
            }}
          >
            <div 
              className="w-4 h-4 rounded-full mr-2 animate-pulse"
              style={{
                backgroundColor: '#00c64e'
              }}
            ></div>
            Tracking...
          </div>
        </div>
      )}

      {/* Persistence Notice */}
      {isRunning && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Timer state is automatically saved. You can close this page and return later.
          </p>
        </div>
      )}


    </div>
  );
} 