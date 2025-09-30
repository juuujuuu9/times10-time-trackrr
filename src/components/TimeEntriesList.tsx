/**
 * IMPORTANT: This file MUST call the API only via src/lib/api/client.ts.
 * Changing endpoints, paths, or schemas is forbidden. If impossible, add a
 * TODO(api-extension) and stop. See /docs/api/extension-proposal.md.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api/client";
import { useState } from "react";

export function TimeEntriesList() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch time entries
  const { data: timeEntries, isLoading, error } = useQuery({
    queryKey: ["timeEntries"],
    queryFn: () => api.listEntries({ limit: 10 }),
    networkMode: 'online',
  });

  // Create time entry mutation
  const createMutation = useMutation({
    mutationKey: ["timeEntry", "create"],
    mutationFn: (data: any) => api.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      setIsCreating(false);
    },
    onError: (error) => {
      console.error("Failed to create time entry:", error);
      setIsCreating(false);
    },
  });

  // Update time entry mutation
  const updateMutation = useMutation({
    mutationKey: ["timeEntry", "update"],
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      api.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
    onError: (error) => {
      console.error("Failed to update time entry:", error);
    },
  });

  // Delete time entry mutation
  const deleteMutation = useMutation({
    mutationKey: ["timeEntry", "delete"],
    mutationFn: (id: number) => api.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    },
    onError: (error) => {
      console.error("Failed to delete time entry:", error);
    },
  });

  const handleCreate = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    createMutation.mutate({
      userId: 1,
      taskId: 1,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      notes: "Test time entry",
    });
  };

  const handleUpdate = async (id: number) => {
    updateMutation.mutate({
      id,
      data: {
        notes: "Updated notes",
      },
    });
  };

  const handleDelete = async (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return <div>Loading time entries...</div>;
  }

  if (error) {
    return <div>Error loading time entries: {error.message}</div>;
  }

  if (!timeEntries?.data || timeEntries.data.length === 0) {
    return (
      <div>
        <h2>Time Entries</h2>
        <p>No time entries found.</p>
        <button
          onClick={handleCreate}
          disabled={isCreating || createMutation.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating || createMutation.isPending ? "Creating..." : "Create Time Entry"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Time Entries</h2>
      <button
        onClick={handleCreate}
        disabled={isCreating || createMutation.isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {isCreating || createMutation.isPending ? "Creating..." : "Create Time Entry"}
      </button>
      
      <div className="space-y-4">
        {timeEntries.data.map((entry) => (
          <div key={entry.id} className="border p-4 rounded">
            <h3 className="font-semibold">{entry.projectName}</h3>
            <p className="text-sm text-gray-600">{entry.clientName}</p>
            <p className="text-sm">
              {new Date(entry.startTime!).toLocaleString()} - {new Date(entry.endTime!).toLocaleString()}
            </p>
            <p className="text-sm">Duration: {Math.floor(entry.duration / 3600)}h {Math.floor((entry.duration % 3600) / 60)}m</p>
            {entry.notes && <p className="text-sm">{entry.notes}</p>}
            
            <div className="mt-2 space-x-2">
              <button
                onClick={() => handleUpdate(entry.id)}
                disabled={updateMutation.isPending}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Updating..." : "Edit"}
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deleteMutation.isPending}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
