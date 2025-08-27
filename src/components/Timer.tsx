import { useState, useEffect } from 'react';
import { useRealtimeTimer } from '../utils/useRealtimeTimer';

interface Task {
  id: number;
  name: string;
  projectName: string;
  clientName: string;
  status: string;
}

export default function Timer() {
  // Real-time synchronized timer component that supports:
  // - Cross-device timer synchronization
  // - Server-side timer state management
  // - Real-time updates across all devices
  // - Automatic conflict resolution
  
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [localTime, setLocalTime] = useState(0);
  
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
      const response = await fetch(`/api/tasks?assignedTo=${currentUserId}`);
      if (response.ok) {
        const tasksData = await response.json();
        const currentTasks = tasksData.data || [];
        setTasks(currentTasks);
        
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
          
          // Show notification to user
          alert('The task you were tracking has been deleted. The timer has been stopped.');
        }
      }
    } catch (error) {
      console.error('Error validating selected task:', error);
    }
  };

  // Initialize component and load user data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            const userId = userData.user.id;
            setCurrentUserId(userId);
            
            // Load user's tasks
            const tasksResponse = await fetch(`/api/tasks?assignedTo=${userId}`);
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json();
              setTasks(tasksData.data || []);
            } else {
              console.error('Failed to load tasks:', tasksResponse.status);
            }
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

  // Update selected task when timer data changes
  useEffect(() => {
    if (timerData && timerData.task) {
      setSelectedTask(timerData.taskId);
    }
  }, [timerData]);

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
        
        // Stop the timer immediately
        setIsRunning(false);
        setTime(0);
        setStartTime(null);
        setSelectedTask(null);
        
        // Clear timer state from localStorage
        if (currentUserId) {
          const timerStateKey = getTimerStateKey(currentUserId);
          localStorage.removeItem(timerStateKey);
        }
        
        // Show notification to user
        alert('The task you were tracking has been deleted. The timer has been stopped.');
      }
    };

    // Listen for custom task deletion events
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);
    
    return () => {
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
    };
  }, [selectedTask, isRunning, currentUserId]);

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

  const handleStartTimer = async () => {
    if (!selectedTask) {
      alert('Please select a task first');
      return;
    }
    if (!currentUserId) {
      alert('Please wait for user data to load, then try again');
      return;
    }

    const success = await startTimer(selectedTask);
    if (success) {
      alert('Timer started successfully!');
    } else {
      alert(timerError || 'Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!timerData) {
      alert('No active timer to stop');
      return;
    }

    const success = await stopTimer(timerData.id);
    if (success) {
      alert('Time entry saved successfully!');
        // Trigger a page refresh to update the recent entries
        window.location.reload();
      } else {
      alert(timerError || 'Failed to stop timer');
    }
  };

  const handleForceStopTimer = async () => {
    if (!timerData) {
      alert('No active timer to stop');
      return;
    }

    if (confirm('This will force stop the timer without saving. Are you sure?')) {
      const success = await forceStopTimer(timerData.id);
      if (success) {
        alert('Timer has been force stopped. No time entry was saved.');
      } else {
        alert(timerError || 'Failed to force stop timer');
      }
    }
  };



  // Get task name for display
  const getSelectedTaskName = () => {
    if (!selectedTask) return '';
    const task = tasks.find(t => t.id === selectedTask);
    return task ? `${task.clientName} - ${task.projectName} - ${task.name}` : '';
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
        >
          <option value="">Choose a task...</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.clientName} - {task.projectName} - {task.name}
            </option>
          ))}
        </select>
        {tasks.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No tasks assigned. Contact your manager.</p>
        )}
      </div>

      {/* Active Task Display */}
      {isRunning && selectedTask && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm font-medium text-gray-900">Currently tracking:</p>
          <p className="text-sm text-gray-700">{getSelectedTaskName()}</p>
          <p className="text-xs text-gray-600 mt-1">
            Started at: {startTime?.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Timer Display */}
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

      {/* Timer Controls */}
      <div className="flex space-x-4 justify-center">
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
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                timerLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'text-white hover:bg-red-700'
              }`}
              style={{
                backgroundColor: timerLoading ? '#D1D5DB' : '#E24236'
              }}
            >
              {timerLoading ? 'Stopping...' : (
                <>
                  Stop
                  <svg 
                    className="w-4 h-4 ml-2" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 21C10.22 21 8.47991 20.4722 6.99987 19.4832C5.51983 18.4943 4.36628 17.0887 3.68509 15.4442C3.0039 13.7996 2.82567 11.99 3.17294 10.2442C3.5202 8.49836 4.37737 6.89472 5.63604 5.63604C6.89472 4.37737 8.49836 3.5202 10.2442 3.17294C11.99 2.82567 13.7996 3.0039 15.4442 3.68509C17.0887 4.36628 18.4943 5.51983 19.4832 6.99987C20.4722 8.47991 21 10.22 21 12C21 14.387 20.0518 16.6761 18.364 18.364C16.6761 20.0518 14.387 21 12 21ZM12 4.5C10.5166 4.5 9.0666 4.93987 7.83323 5.76398C6.59986 6.58809 5.63856 7.75943 5.07091 9.12988C4.50325 10.5003 4.35473 12.0083 4.64411 13.4632C4.9335 14.918 5.64781 16.2544 6.6967 17.3033C7.7456 18.3522 9.08197 19.0665 10.5368 19.3559C11.9917 19.6453 13.4997 19.4968 14.8701 18.9291C16.2406 18.3614 17.4119 17.4001 18.236 16.1668C19.0601 14.9334 19.5 13.4834 19.5 12C19.5 10.0109 18.7098 8.10323 17.3033 6.6967C15.8968 5.29018 13.9891 4.5 12 4.5Z" fill="currentColor"/>
                    <path d="M14.5 8H9.5C8.67157 8 8 8.67157 8 9.5V14.5C8 15.3284 8.67157 16 9.5 16H14.5C15.3284 16 16 15.3284 16 14.5V9.5C16 8.67157 15.3284 8 14.5 8Z" fill="currentColor"/>
                  </svg>
                </>
              )}
            </button>
            <button
              onClick={handleForceStopTimer}
              disabled={timerLoading}
              className="px-6 py-2 rounded-lg font-semibold transition-colors text-white hover:bg-orange-600"
              style={{
                backgroundColor: '#F97316'
              }}
              title="Force stop timer without saving"
            >
              Force Stop
            </button>
          </>
        )}
      </div>

      {/* Status */}
      {isRunning && (
        <div className="mt-4 text-center">
          <div 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-800"
            style={{
              backgroundColor: 'rgba(237, 194, 94, 0.5)' // #EDC25E at 50% opacity
            }}
          >
            <div 
              className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{
                backgroundColor: '#49D449'
              }}
            ></div>
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