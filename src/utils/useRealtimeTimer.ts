import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerData {
  id: number;
  taskId: number;
  startTime: string;
  elapsedSeconds: number;
  notes?: string;
  task?: {
    id: number;
    name: string;
    projectId: number;
    status: string;
  };
}

interface UseRealtimeTimerReturn {
  timerData: TimerData | null;
  isLoading: boolean;
  error: string | null;
  startTimer: (taskId: number, notes?: string) => Promise<boolean>;
  stopTimer: (timerId: number, notes?: string) => Promise<boolean>;
  forceStopTimer: (timerId: number) => Promise<boolean>;
  refreshTimer: () => Promise<void>;
}

export function useRealtimeTimer(pollInterval: number = 2000): UseRealtimeTimerReturn {
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Fetch current timer state from server
  const fetchTimerState = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/timers/ongoing');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (result.data) {
          // Update timer data if it's different from current state
          const currentTime = Date.now();
          if (!timerData || 
              timerData.id !== result.data.id || 
              timerData.elapsedSeconds !== result.data.elapsedSeconds ||
              currentTime - lastUpdateRef.current > 1000) {
            
            setTimerData(result.data);
            lastUpdateRef.current = currentTime;
          }
        } else {
          // No ongoing timer - stop polling to reduce server load
          setTimerData(null);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch timer state');
      }
    } catch (err) {
      console.error('Error fetching timer state:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }, [timerData]);

  // Start polling when timer is active
  const startPolling = useCallback(() => {
    if (!pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(fetchTimerState, pollInterval);
    }
  }, [fetchTimerState, pollInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Start polling for timer updates
  useEffect(() => {
    // Initial fetch
    fetchTimerState();

    // Only set up polling if there's an active timer
    // Polling will be started when a timer is started and stopped when timer is null
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchTimerState]);

  // Start polling if there's already an active timer
  useEffect(() => {
    if (timerData && !pollIntervalRef.current) {
      startPolling();
    }
  }, [timerData, startPolling]);

  // Start a new timer
  const startTimer = useCallback(async (taskId: number, notes?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/timers/ongoing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          taskId, 
          notes, 
          clientTime: new Date().getTime() // Send client's current time as timestamp to preserve timezone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTimerData(result.data);
        // Start polling when timer is active
        startPolling();
        return true;
      } else {
        setError(result.error || 'Failed to start timer');
        return false;
      }
    } catch (err) {
      console.error('Error starting timer:', err);
      setError(err instanceof Error ? err.message : 'Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [startPolling]);

  // Stop the current timer
  const stopTimer = useCallback(async (timerId: number, notes?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/timers/ongoing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          timerId, 
          notes, 
          clientTime: new Date().getTime() // Send client's current time as timestamp to preserve timezone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTimerData(null); // Clear timer data after stopping
        stopPolling(); // Stop polling when timer is stopped
        return true;
      } else {
        setError(result.error || 'Failed to stop timer');
        return false;
      }
    } catch (err) {
      console.error('Error stopping timer:', err);
      setError(err instanceof Error ? err.message : 'Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [stopPolling]);

  // Force stop timer without saving
  const forceStopTimer = useCallback(async (timerId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/timers/ongoing?timerId=${timerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTimerData(null); // Clear timer data after force stopping
        stopPolling(); // Stop polling when timer is force stopped
        return true;
      } else {
        setError(result.error || 'Failed to force stop timer');
        return false;
      }
    } catch (err) {
      console.error('Error force stopping timer:', err);
      setError(err instanceof Error ? err.message : 'Network error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [stopPolling]);

  // Manual refresh of timer state
  const refreshTimer = useCallback(async (): Promise<void> => {
    await fetchTimerState();
  }, [fetchTimerState]);

  return {
    timerData,
    isLoading,
    error,
    startTimer,
    stopTimer,
    forceStopTimer,
    refreshTimer,
  };
}
