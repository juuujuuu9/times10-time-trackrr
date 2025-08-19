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
}

export default function Timer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const state: TimerState = JSON.parse(savedState);
        
        // Only restore if the timer was running
        if (state.isRunning && state.startTime) {
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
            localStorage.removeItem('timerState');
          }
        }
      } catch (error) {
        console.error('Error parsing saved timer state:', error);
        localStorage.removeItem('timerState');
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const timerState: TimerState = {
      isRunning,
      selectedTask,
      startTime: startTime?.toISOString() || null,
      elapsedTime: time
    };
    
    if (isRunning) {
      localStorage.setItem('timerState', JSON.stringify(timerState));
    } else {
      localStorage.removeItem('timerState');
    }
  }, [isRunning, selectedTask, startTime, time]);

  // Handle page unload to ensure timer state is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning) {
        const timerState: TimerState = {
          isRunning,
          selectedTask,
          startTime: startTime?.toISOString() || null,
          elapsedTime: time
        };
        localStorage.setItem('timerState', JSON.stringify(timerState));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning, selectedTask, startTime, time]);

  // Get current user ID and load tasks
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            setCurrentUserId(userData.user.id);
            
            // Load user's tasks
            const tasksResponse = await fetch(`/api/tasks?assignedTo=${userData.user.id}`);
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
  }, []);

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
        // Reset timer
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