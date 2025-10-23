import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeTimer } from '../utils/useRealtimeTimer';

interface TaskTimerProps {
  taskId: number;
  projectId: number; // The actual projectId needed for the timer
  taskName: string;
  projectName: string;
  currentUser: {
    id: number;
    name: string;
    email: string;
  };
}

export default function TaskTimer({ taskId, projectId, taskName, projectName, currentUser }: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log what TaskTimer received
  console.log('🔍 [TASK TIMER DEBUG] TaskTimer received props:', {
    taskId,
    projectId,
    taskName,
    projectName,
    currentUserId: currentUser.id
  });

  // Use the realtime timer hook
  const { 
    timerData, 
    startTimer, 
    stopTimer, 
    isLoading: timerLoading, 
    error: timerError 
  } = useRealtimeTimer(1000);

  // Check if there's an active timer for a different project
  const isTrackingDifferentProject = timerData && timerData.projectId !== projectId;
  const isTrackingCurrentProject = timerData && timerData.projectId === projectId;

  // Update local state when timer data changes
  useEffect(() => {
    if (isTrackingCurrentProject) {
      setIsRunning(true);
      const startTime = new Date(timerData.startTime);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(Math.max(0, elapsed));
    } else {
      setIsRunning(false);
      setElapsedTime(0);
    }
  }, [timerData, isTrackingCurrentProject]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!isRunning || !isTrackingCurrentProject) return;

    const interval = setInterval(() => {
      if (timerData && isTrackingCurrentProject) {
        const startTime = new Date(timerData.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(Math.max(0, elapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerData, isTrackingCurrentProject]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await startTimer(projectId, '');
      if (success) {
        console.log('✅ Timer started successfully');
      } else {
        setError('Failed to start timer');
      }
    } catch (err) {
      console.error('❌ Error starting timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  }, [startTimer, projectId]);

  // Handle switching to this project's timer
  const handleSwitchTimer = useCallback(async () => {
    if (!timerData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First stop the current timer
      const stopSuccess = await stopTimer(timerData.id);
      if (!stopSuccess) {
        setError('Failed to stop current timer');
        return;
      }
      
      // Then start the new timer for this project
      const startSuccess = await startTimer(projectId, '');
      if (startSuccess) {
        console.log('✅ Timer switched successfully');
      } else {
        setError('Failed to start new timer');
      }
    } catch (err) {
      console.error('❌ Error switching timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch timer');
    } finally {
      setIsLoading(false);
    }
  }, [timerData, stopTimer, startTimer, projectId]);


  const handleStop = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (timerData?.id) {
        const success = await stopTimer(timerData.id);
        if (success) {
          console.log('⏹️ Timer stopped successfully');
        } else {
          setError('Failed to stop timer');
        }
      }
    } catch (err) {
      console.error('❌ Error stopping timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop timer');
    } finally {
      setIsLoading(false);
    }
  }, [stopTimer, timerData?.id]);

  const isDisabled = isLoading || timerLoading;

  return (
    <div>
      <div className="flex items-center justify-between">
        {/* Start/Stop/Switch Button */}
        <div className="flex-shrink-0">
          {isTrackingDifferentProject ? (
            // Grayed out button for different project
            <button
              onClick={handleSwitchTimer}
              disabled={isDisabled}
              className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full hover:bg-gray-300 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center"
              title="Switch to tracking time for this project"
            >
              {isDisabled ? (
                <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          ) : isRunning ? (
            // Stop button for current project
            <button
              onClick={handleStop}
              disabled={isDisabled}
              className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              title="Stop timer"
            >
              {isDisabled ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12"/>
                </svg>
              )}
            </button>
          ) : (
            // Start button for current project
            <button
              onClick={handleStart}
              disabled={isDisabled}
              className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full hover:bg-green-500 hover:text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              title="Start timer"
            >
              {isDisabled ? (
                <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Timer Display or Switch Message */}
        <div className="flex-shrink-0">
          {isTrackingDifferentProject ? (
            <div className="text-sm text-gray-500 text-right pl-4">
              <div className="font-medium">Switch to {projectName}</div>
              <div className="text-xs">Click to track time here</div>
            </div>
          ) : (
            <div 
              className="text-2xl text-black"
              style={{ 
                fontFamily: '"Istok Web", system-ui, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'normal'
              }}
            >
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading Indicator */}
      {(isLoading || timerLoading) && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}
