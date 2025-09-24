import { useState, useEffect } from 'react';
import { useRealtimeTimer } from '../utils/useRealtimeTimer';

interface Task {
  id: number;
  name: string;
  projectName: string;
  clientName: string;
  status: string;
  displayName?: string; // For system-generated tasks
}

export default function AdminTimer() {
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
      // Load projects and get their General tasks
      const projectsResponse = await fetch(`/api/projects?userId=${currentUserId}&limit=50`);
      let currentTasks = [];
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projects = projectsData.data || [];
        
        // For each project, get its General task (skip Time Tracking projects)
        for (const project of projects) {
          // Skip "Time Tracking" projects entirely
          if (project.name === 'Time Tracking') {
            continue;
          }
          
          try {
            const generalTaskResponse = await fetch(`/api/projects/${project.id}/general-task`);
            if (generalTaskResponse.ok) {
              const generalTask = await generalTaskResponse.json();
              // Format as expected by the component
              // Show just the project name as the task name
              currentTasks.push({
                id: generalTask.id,
                name: project.name, // Just the project name, no "General" suffix
                projectName: project.name,
                clientName: project.clientName,
                projectId: project.id,
                clientId: project.clientId
              });
            }
          } catch (error) {
            console.warn(`Failed to load General task for project ${project.name}:`, error);
          }
        }
      }
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
        
        // Task was deleted, timer stopped
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
            
            // Load user's projects and get their General tasks
            const projectsResponse = await fetch(`/api/projects?userId=${userId}&limit=50`);
            let allTasks = [];
            
            if (projectsResponse.ok) {
              const projectsData = await projectsResponse.json();
              const projects = projectsData.data || [];
              
              // For each project, get its General task (include both new and legacy projects)
              for (const project of projects) {
                try {
                  const generalTaskResponse = await fetch(`/api/projects/${project.id}/general-task`);
                  if (generalTaskResponse.ok) {
                    const generalTask = await generalTaskResponse.json();
                    
                    // For legacy "Time Tracking" projects: show task name (General)
                    // For new structure projects: show project name
                    const displayName = project.name === 'Time Tracking' 
                      ? generalTask.name  // Show "General" for legacy tasks
                      : project.name;    // Show project name for new structure
                    
                    allTasks.push({
                      id: generalTask.id,
                      name: displayName,
                      projectName: project.name,
                      clientName: project.clientName,
                      projectId: project.id,
                      clientId: project.clientId
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to load General task for project ${project.name}:`, error);
                }
              }
            } else {
              console.error('Failed to load projects:', projectsResponse.status);
            }
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
        // For legacy "Time Tracking" projects: show task name (General)
        // For new structure projects: show project name
        const displayText = task.projectName === 'Time Tracking' 
          ? task.displayName || `${task.clientName} - ${task.name}`
          : task.displayName || `${task.clientName} - ${task.projectName}`;
        setTaskSearchTerm(displayText);
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

  // Listen for timer stopped events to refresh timer state
  useEffect(() => {
    const handleTimerStopped = () => {
      // Refresh timer state immediately when timer is stopped from elsewhere
      refreshTimer();
    };

    window.addEventListener('timerStopped', handleTimerStopped);
    
    return () => {
      window.removeEventListener('timerStopped', handleTimerStopped);
    };
  }, [refreshTimer]);



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





  // Get task name for display
  const getSelectedTaskName = () => {
    if (!selectedTask) return '';
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return '';
    
    // Use displayName for system-generated tasks, otherwise use the task name
    return task.displayName || task.name;
  };

  // Get client name for display
  const getSelectedTaskClientName = () => {
    if (!selectedTask) return '';
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return '';
    
    return task.clientName;
  };

  // Get full task info for display
  const getSelectedTaskInfo = () => {
    if (!selectedTask) return { taskName: '', projectName: '', clientName: '' };
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) return { taskName: '', projectName: '', clientName: '' };
    
    // Use displayName for system-generated tasks, otherwise use the task name
    const taskName = task.displayName || task.name;
    
    return {
      taskName: taskName,
      projectName: task.projectName,
      clientName: task.clientName
    };
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
        <div className="px-3 py-2 text-gray-500 text-xs">
          {taskSearchTerm.trim() ? 'No tasks found' : 'No tasks assigned'}
        </div>
      );
    }
    
    return (
      <div>
        {sortedClients.map((clientName, clientIndex) => (
          <div key={clientName}>
            {/* Client Header */}
            <div className="px-3 py-1 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {clientName}
            </div>
            
            {/* Tasks for this client */}
            {clientGroups[clientName].map((task, taskIndex) => (
              <div
                key={task.id}
                className="pl-3 py-1 hover:bg-gray-100 cursor-pointer text-xs border-b border-gray-100 last:border-b-0"
                onClick={() => {
                  setSelectedTask(task.id);
                  // For legacy "Time Tracking" projects: show task name (General)
        // For new structure projects: show project name
        // In selected state, show Client - Task for better UX
        const displayText = task.projectName === 'Time Tracking' 
          ? task.displayName || `${task.clientName} - ${task.name}`
          : task.displayName || `${task.clientName} - ${task.projectName}`;
        setTaskSearchTerm(displayText);
                  setTaskDropdownOpen(false);
                }}
              >
                <div className="font-medium text-gray-900">
                  {task.projectName === 'Time Tracking' 
                    ? (task.displayName || task.name)
                    : (task.displayName || task.projectName)}
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
      {!isRunning && (
        <div className="mb-3 relative task-dropdown-container">
          <input
            type="text"
            placeholder="🔍 Search projects..."
            value={taskSearchTerm}
            onChange={(e) => setTaskSearchTerm(e.target.value)}
            autoComplete="off"
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
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          
          {/* Task Dropdown */}
          {taskDropdownOpen && (
            <div 
              className="absolute z-50 w-full bg-white border border-gray-300 rounded shadow-lg overflow-hidden" 
              style={{ 
                top: '100%', 
                left: 0, 
                maxHeight: '160px',
                overflowY: 'auto'
              }}
            >
              {renderTaskDropdown()}
            </div>
          )}
          
          {tasks.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No tasks assigned</p>
          )}
        </div>
      )}

      {/* Active Task Display */}
      {isRunning && selectedTask && (
        <div className="mb-3 px-1 py-0 bg-gray-200 border border-gray-200 rounded text-xs">
          <p className="text-gray-700 font-bold">{getSelectedTaskClientName()}</p>
          <p className="text-gray-600">{getSelectedTaskName()}</p>
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
