import { useState, useEffect } from 'react';

interface Task {
  id: number;
  name: string;
  projectName: string;
  status: string;
}

interface TimerState {
  isRunning: boolean;
  selectedTask: number | null;
  startTime: string | null;
  elapsedTime: number;
  userId: number; // Add userId to timer state
  stopped: boolean; // Flag to indicate if timer was explicitly stopped
}

export default function Timer() {
  // Multi-user timer component that supports:
  // - Multiple users tracking time simultaneously
  // - User-specific timer state persistence
  // - Cross-tab/window timer synchronization
  // - Automatic session validation and cleanup
  
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Get timer state key based on user ID
  const getTimerStateKey = (userId: number) => `timerState_${userId}`;

  // Clear timer state for a specific user (used when that user logs out)
  const clearUserTimerState = (userId: number) => {
    const timerStateKey = getTimerStateKey(userId);
    localStorage.removeItem(timerStateKey);
  };

  // Clear timer state for all users (used when logging out)
  const clearAllTimerStates = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('timerState_')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        // Get current user first
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            const userId = userData.user.id;
            setCurrentUserId(userId);
            
            // Load user-specific timer state
            const timerStateKey = getTimerStateKey(userId);
            const savedState = localStorage.getItem(timerStateKey);
            
            if (savedState) {
              try {
                const state: TimerState = JSON.parse(savedState);
                
                // Verify this timer state belongs to the current user
                if (state.userId === userId && state.isRunning && state.startTime && !state.stopped) {
                  const startTimeDate = new Date(state.startTime);
                  const now = new Date();
                  const elapsedSeconds = Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
                  
                  // If the timer was started more than 24 hours ago, don't restore it
                  if (elapsedSeconds < 24 * 60 * 60) {
                    setTime(elapsedSeconds);
                    setIsRunning(true);
                    setSelectedTask(state.selectedTask);
                    setStartTime(startTimeDate);
                  } else {
                    // Clear expired timer state
                    localStorage.removeItem(timerStateKey);
                  }
                } else if (state.userId !== userId || state.stopped) {
                  // Clear timer state from different user or stopped timer
                  localStorage.removeItem(timerStateKey);
                }
              } catch (error) {
                console.error('Error parsing saved timer state:', error);
                localStorage.removeItem(timerStateKey);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    };

    loadTimerState();
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (!currentUserId) return;

    const timerState: TimerState = {
      isRunning,
      selectedTask,
      startTime: startTime?.toISOString() || null,
      elapsedTime: time,
      userId: currentUserId,
      stopped: false
    };
    
    const timerStateKey = getTimerStateKey(currentUserId);
    
    if (isRunning && startTime) {
      localStorage.setItem(timerStateKey, JSON.stringify(timerState));
    } else {
      // Only remove if we're not in the middle of stopping the timer
      if (!loading) {
        localStorage.removeItem(timerStateKey);
      }
    }
  }, [isRunning, selectedTask, startTime, time, currentUserId, loading]);

  // Handle page unload to ensure timer state is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning && currentUserId) {
        const timerState: TimerState = {
          isRunning,
          selectedTask,
          startTime: startTime?.toISOString() || null,
          elapsedTime: time,
          userId: currentUserId,
          stopped: false
        };
        const timerStateKey = getTimerStateKey(currentUserId);
        localStorage.setItem(timerStateKey, JSON.stringify(timerState));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && currentUserId) {
        // Page is hidden, save timer state
        const timerState: TimerState = {
          isRunning,
          selectedTask,
          startTime: startTime?.toISOString() || null,
          elapsedTime: time,
          userId: currentUserId,
          stopped: false
        };
        const timerStateKey = getTimerStateKey(currentUserId);
        localStorage.setItem(timerStateKey, JSON.stringify(timerState));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, selectedTask, startTime, time, currentUserId]);

  // Listen for storage changes to detect user switches
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If timer state changes and it's for the current user, update the timer
      if (e.key && e.key.startsWith('timerState_') && currentUserId) {
        const keyUserId = parseInt(e.key.replace('timerState_', ''));
        if (keyUserId === currentUserId) {
          // This is our timer state, reload it
          const savedState = localStorage.getItem(e.key);
          if (savedState) {
            try {
              const state: TimerState = JSON.parse(savedState);
              if (state.userId === currentUserId && !state.stopped) {
                setTime(state.elapsedTime || 0);
                setIsRunning(state.isRunning || false);
                setSelectedTask(state.selectedTask);
                setStartTime(state.startTime ? new Date(state.startTime) : null);
              } else if (state.userId === currentUserId && state.stopped) {
                // Clear stopped timer state
                localStorage.removeItem(e.key);
                setTime(0);
                setIsRunning(false);
                setSelectedTask(null);
                setStartTime(null);
              }
            } catch (error) {
              console.error('Error parsing timer state from storage event:', error);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUserId]);

  // Check for session validity periodically
  useEffect(() => {
    if (!currentUserId) return;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          // Session is invalid, clear only this user's timer state
          clearUserTimerState(currentUserId);
          setTime(0);
          setIsRunning(false);
          setSelectedTask(null);
          setStartTime(null);
          setCurrentUserId(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Global timer state manager for multi-user support
  useEffect(() => {
    if (!currentUserId) return;

    // Broadcast timer state changes to other tabs/windows
    const broadcastTimerState = () => {
      if (isRunning && currentUserId) {
        const timerState: TimerState = {
          isRunning,
          selectedTask,
          startTime: startTime?.toISOString() || null,
          elapsedTime: time,
          userId: currentUserId,
          stopped: false
        };
        
        // Broadcast to other tabs/windows
        window.postMessage({
          type: 'TIMER_STATE_UPDATE',
          userId: currentUserId,
          state: timerState
        }, '*');
      }
    };

    // Listen for timer state updates from other tabs/windows
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TIMER_STATE_UPDATE' && event.data.userId === currentUserId) {
        const state = event.data.state;
        if (!state.stopped) {
          setTime(state.elapsedTime || 0);
          setIsRunning(state.isRunning || false);
          setSelectedTask(state.selectedTask);
          setStartTime(state.startTime ? new Date(state.startTime) : null);
        } else {
          // Clear stopped timer state
          setTime(0);
          setIsRunning(false);
          setSelectedTask(null);
          setStartTime(null);
        }
      }
    };

    // Broadcast timer state every second when running
    let broadcastInterval: NodeJS.Timeout;
    if (isRunning) {
      broadcastInterval = setInterval(broadcastTimerState, 1000);
    }

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (broadcastInterval) {
        clearInterval(broadcastInterval);
      }
    };
  }, [currentUserId, isRunning, selectedTask, startTime, time]);

  // Get current user ID and load tasks
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            const newUserId = userData.user.id;
            
            // If user ID changed, load the new user's timer state
            if (currentUserId && currentUserId !== newUserId) {
              // Save current timer state before switching
              if (isRunning) {
                const timerState: TimerState = {
                  isRunning,
                  selectedTask,
                  startTime: startTime?.toISOString() || null,
                  elapsedTime: time,
                  userId: currentUserId,
                  stopped: false
                };
                const currentTimerStateKey = getTimerStateKey(currentUserId);
                localStorage.setItem(currentTimerStateKey, JSON.stringify(timerState));
              }
              
              // Load new user's timer state
              const newTimerStateKey = getTimerStateKey(newUserId);
              const savedState = localStorage.getItem(newTimerStateKey);
              
              if (savedState) {
                try {
                  const state: TimerState = JSON.parse(savedState);
                  if (state.userId === newUserId && state.isRunning && state.startTime && !state.stopped) {
                    const startTimeDate = new Date(state.startTime);
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
                    
                    if (elapsedSeconds < 24 * 60 * 60) {
                      setTime(elapsedSeconds);
                      setIsRunning(true);
                      setSelectedTask(state.selectedTask);
                      setStartTime(startTimeDate);
                    } else {
                      localStorage.removeItem(newTimerStateKey);
                      setTime(0);
                      setIsRunning(false);
                      setSelectedTask(null);
                      setStartTime(null);
                    }
                  } else {
                    // Clear stopped or invalid timer state
                    if (state.stopped) {
                      localStorage.removeItem(newTimerStateKey);
                    }
                    setTime(0);
                    setIsRunning(false);
                    setSelectedTask(null);
                    setStartTime(null);
                  }
                } catch (error) {
                  console.error('Error loading new user timer state:', error);
                  setTime(0);
                  setIsRunning(false);
                  setSelectedTask(null);
                  setStartTime(null);
                }
              } else {
                setTime(0);
                setIsRunning(false);
                setSelectedTask(null);
                setStartTime(null);
              }
            }
            
            setCurrentUserId(newUserId);
            
            // Load user's tasks
            const tasksResponse = await fetch(`/api/tasks?assignedTo=${newUserId}`);
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json();
              setTasks(tasksData.data || []);
            } else {
              console.error('Failed to load tasks:', tasksResponse.status);
            }
          } else {
            console.error('Invalid user data:', userData);
          }
        } else {
          console.error('Failed to get user data:', userResponse.status);
        }
      } catch (error) {
        console.error('Error initializing timer data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    initializeData();
  }, [currentUserId, isRunning, selectedTask, startTime, time]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!selectedTask) {
      alert('Please select a task first');
      return;
    }
    if (!currentUserId) {
      alert('Please wait for user data to load, then try again');
      return;
    }
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setTime(0); // Reset time when starting fresh
  };

  const stopTimer = async () => {
    if (!isRunning || !selectedTask || !startTime) return;

    if (!currentUserId) {
      alert('Unable to save time entry: User data not loaded. Please refresh the page and try again.');
      return;
    }

    setIsRunning(false);
    setLoading(true);

    try {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: selectedTask,
          userId: currentUserId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: duration
        }),
      });

      if (response.ok) {
        // Mark the timer as stopped in localStorage before clearing
        if (currentUserId) {
          const timerStateKey = getTimerStateKey(currentUserId);
          const stoppedState: TimerState = {
            isRunning: false,
            selectedTask: null,
            startTime: null,
            elapsedTime: 0,
            userId: currentUserId,
            stopped: true
          };
          localStorage.setItem(timerStateKey, JSON.stringify(stoppedState));
        }
        
        // Reset timer state
        setTime(0);
        setStartTime(null);
        setSelectedTask(null);
        
        // Trigger a page refresh to update the recent entries
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error saving time entry: ${errorData.error || 'Unknown error'}`);
        // Restart the timer since save failed
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Error saving time entry. Please try again.');
      // Restart the timer since save failed
      setIsRunning(true);
    } finally {
      setLoading(false);
    }
  };

  // Get task name for display
  const getSelectedTaskName = () => {
    if (!selectedTask) return '';
    const task = tasks.find(t => t.id === selectedTask);
    return task ? `${task.name} - ${task.projectName}` : '';
  };

  // Show loading state while data is being loaded
  if (dataLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Tracker</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Tracker</h2>
      
      {/* Task Selection */}
      <div className="mb-6">
        <label htmlFor="taskSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select Task
        </label>
        <select
          id="taskSelect"
          value={selectedTask || ''}
          onChange={(e) => setSelectedTask(e.target.value ? parseInt(e.target.value) : null)}
          disabled={isRunning}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Choose a task...</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name} - {task.projectName}
            </option>
          ))}
        </select>
        {tasks.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No tasks assigned. Contact your manager.</p>
        )}
      </div>

      {/* Active Task Display */}
      {isRunning && selectedTask && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Currently tracking:</p>
          <p className="text-sm text-blue-700">{getSelectedTaskName()}</p>
          <p className="text-xs text-blue-600 mt-1">
            Started at: {startTime?.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-4xl font-mono text-center mb-6 text-blue-600">
        {formatTime(time)}
      </div>

      {/* Timer Controls */}
      <div className="flex space-x-4 justify-center">
        {!isRunning ? (
          <button
            onClick={startTimer}
            disabled={!selectedTask || loading || !currentUserId}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              !selectedTask || loading || !currentUserId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loading ? 'Saving...' : 'Start'}
          </button>
        ) : (
          <button
            onClick={stopTimer}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {loading ? 'Saving...' : 'Stop'}
          </button>
        )}
      </div>

      {/* Status */}
      {isRunning && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            Tracking time...
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