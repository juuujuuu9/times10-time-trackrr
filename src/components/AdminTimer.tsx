import { useState, useEffect } from 'react';
import { useRealtimeTimer } from '../utils/useRealtimeTimer';

interface Task {
  id: number;
  name: string;
  projectName: string;
  clientName: string;
  status: string;
}

export default function AdminTimer() {
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
      alert('Please wait for user data to load, then try again');
      return;
    }

    const success = await startTimer(selectedTask);
    if (success) {
      alert('Timer started successfully!');
      // Trigger a custom event to notify the dashboard to refresh
      window.dispatchEvent(new CustomEvent('timerStarted'));
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
    return task ? `${task.name}` : '';
  };

  // Get full task info for display
  const getSelectedTaskInfo = () => {
    if (!selectedTask) return { taskName: '', projectName: '', clientName: '' };
    const task = tasks.find(t => t.id === selectedTask);
    return task ? {
      taskName: task.name,
      projectName: task.projectName,
      clientName: task.clientName
    } : { taskName: '', projectName: '', clientName: '' };
  };

  // Show loading state while data is being loaded
  if (dataLoading) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-2 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-normal text-gray-500 uppercase">Time Tracker</h3>
        {isRunning && (
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Tracking...</span>
          </div>
        )}
      </div>
      
      {/* Task Selection */}
      <div className="mb-3">
        <select
          value={selectedTask || ''}
          onChange={(e) => {
            setSelectedTask(e.target.value ? parseInt(e.target.value) : null);
          }}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="">Choose a task...</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
        {tasks.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">No tasks assigned</p>
        )}
      </div>

      {/* Active Task Display */}
      {isRunning && selectedTask && (
        <div className="mb-3 px-1 py-0 bg-gray-200 border border-gray-200 rounded text-xs">
          <p className="text-gray-700">{getSelectedTaskInfo().taskName}</p>
          <p className="text-gray-600 text-xs">{getSelectedTaskInfo().projectName} • {getSelectedTaskInfo().clientName}</p>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-3">
        <div 
          className="text-2xl font-mono font-bold text-gray-900"
          style={{ 
            fontFamily: '"Istok Web", system-ui, sans-serif',
            fontWeight: 'bold'
          }}
        >
          {formatTime(time)}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex space-x-2">
        {!isRunning ? (
          <button
            onClick={handleStartTimer}
            disabled={timerLoading || !currentUserId}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors border-0 ${
              timerLoading || !currentUserId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {timerLoading ? 'Starting...' : 'Start'}
          </button>
        ) : (
          <>
            <button
              onClick={handleStopTimer}
              disabled={timerLoading}
              className={`flex-1 flex row items-center justify-center px-3 py-2 text-xs font-medium rounded transition-colors border-0 ${
                timerLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {timerLoading ? 'Stopping...' : (
                <>
                  Stop
                  <svg viewBox="0 0 24 24" className="w-3 h-3 ml-1" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className="mt-2 text-center">
          <a href="/time-entries" className="text-xs text-gray-500 hover:text-gray-700 underline">View Your Timesheet</a>
        </div>
    </div>
  );
}
