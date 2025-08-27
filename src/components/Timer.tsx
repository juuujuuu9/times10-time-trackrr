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
            <button
              onClick={handleForceStopTimer}
              disabled={timerLoading}
              className="flex items-center justify-center px-1 py-1 text-xs font-medium rounded transition-colors border-0 bg-gray-900 text-white hover:bg-gray-600"
              title="Force stop timer without saving"
            >
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <g clip-path="url(#clip0_429_11083)">
                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </g>
                  <defs> 
                    <clipPath id="clip0_429_11083">
                      <rect width="24" height="24" fill="white"></rect>
                    </clipPath>
                  </defs>
                </g>
              </svg>
            </button>
          </>
        )}
      </div>

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