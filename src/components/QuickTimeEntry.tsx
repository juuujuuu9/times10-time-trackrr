import { useState } from 'react';

interface QuickTimeEntryProps {
  userId: number;
  taskId: number;
  taskName: string;
  taskDate?: string; // Optional task date in YYYY-MM-DD format
  onTimeEntryCreated?: () => void;
}

export default function QuickTimeEntry({ userId, taskId, taskName, taskDate, onTimeEntryCreated }: QuickTimeEntryProps) {
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duration.trim()) {
      setError('Duration is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          taskId,
          duration: duration.trim(),
          notes: notes.trim() || null,
          taskDate: taskDate || new Date().toISOString().split('T')[0], // Default to today if not provided
        }),
      });

      if (response.ok) {
        setDuration('');
        setNotes('');
        onTimeEntryCreated?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create time entry');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-medium text-white mb-3">Quick Time Entry</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Task
          </label>
          <div className="text-white bg-gray-700 px-3 py-2 rounded-md">
            {taskName}
          </div>
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
            Duration
          </label>
          <input
            type="text"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 2h, 3.5hr, 4:15, 90m"
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-400 mt-1">
            Supported formats: 2h, 2hr, 3.5hr, 4:15, 90m, 5400s, etc.
          </p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !duration.trim()}
          className="w-full px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Time Entry'}
        </button>
      </form>
    </div>
  );
} 