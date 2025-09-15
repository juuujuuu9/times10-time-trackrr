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
  
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [localTime, setLocalTime] = useState(0);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.task-dropdown-container')) {
        setTaskDropdownOpen(false);
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
      // Load regular tasks
      const response = await fetch(`/api/tasks?assignedTo=${currentUserId}`);
      let regularTasks = [];
      if (response.ok) {
        const tasksData = await response.json();
        regularTasks = tasksData.data || [];
      }

      // Load system tasks
      const systemResponse = await fetch(`/api/system-tasks?assignedTo=${currentUserId}&limit=100`);
      let systemTasks = [];
      if (systemResponse.ok) {
        const systemTasksData = await systemResponse.json();
        systemTasks = systemTasksData.data || [];
      }

      // Combine all tasks
      const currentTasks = [...regularTasks, ...systemTasks];
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
            
            // Load user's regular tasks
            const tasksResponse = await fetch(`/api/tasks?assignedTo=${userId}`);
            let regularTasks = [];
            if (tasksResponse.ok) {
              const tasksData = await tasksResponse.json();
              regularTasks = tasksData.data || [];
            } else {
              console.error('Failed to load regular tasks:', tasksResponse.status);
            }

            // Load user's system-generated tasks (General tasks)
            const systemTasksResponse = await fetch(`/api/system-tasks?assignedTo=${userId}&limit=100`);
            let systemTasks = [];
            if (systemTasksResponse.ok) {
              const systemTasksData = await systemTasksResponse.json();
              systemTasks = systemTasksData.data || [];
            } else {
              console.error('Failed to load system tasks:', systemTasksResponse.status);
            }

            // Combine regular tasks and system tasks
            const allTasks = [...regularTasks, ...systemTasks];
            setTasks(allTasks);
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
      // Update search term to show the selected task
      const task = tasks.find(t => t.id === timerData.taskId);
      if (task) {
        setTaskSearchTerm(task.displayName || `${task.clientName} - ${task.projectName} - ${task.name}`);
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
        
        // Show notification to user
        alert('The task you were tracking has been deleted. The timer has been stopped.');
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
      // Close the dropdown when timer starts
      setTaskDropdownOpen(false);
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
    if (!task) return '';
    
    // Use displayName for system-generated tasks, otherwise use the standard format
    return task.displayName || `${task.clientName} - ${task.projectName} - ${task.name}`;
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
  const getFilteredTasks = () => {
    if (!taskSearchTerm.trim()) {
      return organizeTasksByClient();
    }
    
    const searchTerm = taskSearchTerm.toLowerCase();
    const filteredTasks = tasks.filter(task => 
      task.clientName.toLowerCase().includes(searchTerm) ||
      task.projectName.toLowerCase().includes(searchTerm) ||
      task.name.toLowerCase().includes(searchTerm) ||
      (task.displayName && task.displayName.toLowerCase().includes(searchTerm))
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
                  setTaskSearchTerm(task.displayName || `${task.clientName} - ${task.projectName} - ${task.name}`);
                  setTaskDropdownOpen(false);
                }}
              >
                <div className="font-medium text-gray-900">
                  {task.displayName || `${task.clientName} - ${task.projectName} - ${task.name}`}
                </div>
              </div>
            ))}
          </div>
        ))}
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Tracker</h2>
      
      {/* Task Selection */}
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
            onFocus={() => !isRunning && setTaskDropdownOpen(true)}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <svg className="fill-current h-5 w-5 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        
        {/* Task Dropdown */}
        {taskDropdownOpen && !isRunning && (
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

      {/* Active Task Display */}
      {isRunning && selectedTask && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm font-medium text-gray-900">Currently tracking:</p>
          <p className="text-lg font-medium text-gray-800">{getSelectedTaskClientName()}</p>
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