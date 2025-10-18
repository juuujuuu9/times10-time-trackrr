import React, { useState, useEffect } from 'react';

interface TeamNote {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isOwn: boolean;
}

interface TeamNotesProps {
  teamId: number;
  currentUserId: number;
  className?: string;
}

export const TeamNotes: React.FC<TeamNotesProps> = ({ 
  teamId, 
  currentUserId, 
  className = '' 
}) => {
  const [notes, setNotes] = useState<TeamNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load notes
  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/notes`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setNotes(result.data.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          isOwn: note.userId === currentUserId
        })));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new note
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newNote.trim() })
      });

      const result = await response.json();
      
      if (result.success) {
        setNewNote('');
        // Add the new note to the list
        setNotes(prev => [{
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          isOwn: true
        }, ...prev]);
      } else {
        alert('Error saving note: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing a note
  const startEditing = (note: TeamNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
  };

  // Save edited note
  const saveEdit = async (noteId: number) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: editContent.trim() })
      });

      const result = await response.json();
      
      if (result.success) {
        setNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { ...note, content: editContent.trim(), updatedAt: new Date() }
            : note
        ));
        setEditingNote(null);
        setEditContent('');
      } else {
        alert('Error updating note: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Error updating note. Please try again.');
    }
  };

  // Delete note
  const deleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        alert('Error deleting note: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [teamId]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Team Notes</h3>
          <button
            onClick={loadNotes}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      <div className="px-4 py-3 border-b border-gray-200">
        <form onSubmit={addNote} className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note for the team..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSaving}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newNote.trim() || isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p className="text-gray-500">No notes yet. Add the first one!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{note.userName}</div>
                      <div className="text-xs text-gray-500">
                        {note.createdAt.toLocaleString()}
                        {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {note.isOwn && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEditing(note)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(note.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 whitespace-pre-wrap">{note.content}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
