import { useState, useEffect } from 'react';

interface Task {
  id: number;
  name: string;
  projectName: string;
  clientName: string;
  status: string;
}

interface TimerState {
  isRunning: boolean;
  selectedTask: number | null;
  startTime: string | null;
  elapsedTime: number;
  userId: number;
  stopped: boolean;
}

export default function AdminTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Get timer state key based on user ID
  const getTimerStateKey = (userId: number) => `adminTimerState_${userId}`;

  // Load timer state from localStorage on component mount
  useEffect(() => {
    const loadTimerState = async () => {
      try {
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
                    localStorage.removeItem(timerStateKey);
                  }
                } else if (state.userId !== userId || state.stopped) {
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
      if (!loading) {
        localStorage.removeItem(timerStateKey);
      }
    }
  }, [isRunning, selectedTask, startTime, time, currentUserId, loading]);

  // Get current user ID and load tasks
  useEffect(() => {
    const initializeData = async () => {
      try {
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            const newUserId = userData.user.id;
            setCurrentUserId(newUserId);
            
            // Load user's tasks
            const tasksResponse = await fetch(`/api/tasks?assignedTo=${newUserId}`);
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
      return;
    }
    if (!currentUserId) {
      alert('Please wait for user data to load, then try again');
      return;
    }
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setTime(0);
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
        // Mark the timer as stopped in localStorage
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
        
        // Show success message
        alert('Time entry saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error saving time entry: ${errorData.error || 'Unknown error'}`);
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Error saving time entry. Please try again.');
      setIsRunning(true);
    } finally {
      setLoading(false);
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
        <h3 className="text-sm font-medium text-gray-600">Time Tracker</h3>
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
            onClick={startTimer}
            disabled={loading || !currentUserId}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors border-0 ${
              loading || !currentUserId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {loading ? 'Saving...' : 'Start'}
          </button>
        ) : (
          <button
            onClick={stopTimer}
            disabled={loading}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors border-0 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {loading ? 'Saving...' : 'Stop'}
          </button>
        )}
      </div>



      {/* Status */}
        <div className="mt-2 text-right">
          <a href="/time-entries" className="text-xs text-gray-500 hover:text-gray-700 underline">View Your Timesheet</a>
        </div>
    </div>
  );
}
