/**
 * IMPORTANT: This file MUST call the API only via src/lib/api/client.ts.
 * Changing endpoints, paths, or schemas is forbidden. If impossible, add a
 * TODO(api-extension) and stop. See /docs/api/extension-proposal.md.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api/client";
import { useState } from "react";

interface StartStopButtonProps {
  entry?: { id: number; taskId: number; notes?: string };
  taskId?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StartStopButton({ 
  entry, 
  taskId = 1, 
  onSuccess, 
  onError 
}: StartStopButtonProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startMutation = useMutation({
    mutationKey: ["timer", "start"],
    mutationFn: (vars: { taskId: number; notes?: string }) =>
      api.startTimer({
        taskId: vars.taskId,
        notes: vars.notes,
        clientTime: Date.now(),
      }),
    onSuccess: (data) => {
      console.log("Timer started successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["ongoingTimer"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to start timer:", error);
      onError?.(error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const stopMutation = useMutation({
    mutationKey: ["timer", entry?.id, "stop"],
    mutationFn: () => api.stopTimer(entry!.id),
    onSuccess: (data) => {
      console.log("Timer stopped successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["ongoingTimer"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to stop timer:", error);
      onError?.(error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleStart = async () => {
    if (isSubmitting || startMutation.isPending) return;
    
    setIsSubmitting(true);
    startMutation.mutate({ taskId, notes: "" });
  };

  const handleStop = async () => {
    if (isSubmitting || stopMutation.isPending) return;
    
    setIsSubmitting(true);
    stopMutation.mutate();
  };

  const isPending = startMutation.isPending || stopMutation.isPending;
  const isDisabled = isPending || isSubmitting;

  if (entry?.id) {
    return (
      <button
        disabled={isDisabled}
        onClick={handleStop}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Stopping..." : "Stop Timer"}
      </button>
    );
  }

  return (
    <button
      disabled={isDisabled}
      onClick={handleStart}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "Starting..." : "Start Timer"}
    </button>
  );
}
