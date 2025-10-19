import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeTimer } from '../utils/useRealtimeTimer';

interface TaskTimerProps {
  taskId: number;
  taskName: string;
  projectName: string;
  currentUser: {
    id: number;
    name: string;
    email: string;
  };
}

export default function TaskTimer({ taskId, taskName, projectName, currentUser }: TaskTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the realtime timer hook
  const { 
    timerData, 
    startTimer, 
    stopTimer, 
    isLoading: timerLoading, 
    error: timerError 
  } = useRealtimeTimer(1000);

  // Update local state when timer data changes
  useEffect(() => {
    if (timerData) {
      setIsRunning(true);
      const startTime = new Date(timerData.startTime);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(Math.max(0, elapsed));
    } else {
      setIsRunning(false);
      setElapsedTime(0);
    }
  }, [timerData]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (timerData) {
        const startTime = new Date(timerData.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(Math.max(0, elapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerData]);

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
      const success = await startTimer(taskId, '');
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
  }, [startTimer, taskId]);


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
        {/* Start/Stop Button */}
        <div className="flex-shrink-0">
          {isRunning ? (
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

        {/* Timer Display */}
        <div className="flex-shrink-0">
          <div 
            className="text-2xl text-black"
            style={{ 
              fontFamily: 'RadiolandTest, monospace',
              fontWeight: 'bold',
              fontStyle: 'normal'
            }}
          >
            {formatTime(elapsedTime)}
          </div>
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
