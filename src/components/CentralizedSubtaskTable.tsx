import React, { useState } from 'react';
import { FileText, User, Calendar, Check, Trash2 } from 'lucide-react';

interface Subtask {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
  assignees?: string[];
  dueDate?: string;
  completed?: boolean;
}

interface CentralizedSubtaskTableProps {
  subtasks: Subtask[];
  className?: string;
  collaborationId?: number;
  taskId?: number;
  onSubtaskUpdate?: (subtaskId: string, completed: boolean) => void;
  onDelete?: (subtaskId: string) => void;
}

const CentralizedSubtaskTable: React.FC<CentralizedSubtaskTableProps> = ({ 
  subtasks, 
  className = '', 
  collaborationId, 
  taskId, 
  onSubtaskUpdate,
  onDelete 
}) => {
  console.log('🔍 CentralizedSubtaskTable props:', { subtasks: subtasks?.length, onDelete: !!onDelete, collaborationId, taskId });
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleTaskCompletion = async (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const newCompleted = !subtask.completed;
    
    // Show loading state
    setUpdatingTasks(prev => new Set(prev).add(subtaskId));

    try {
      // Call the parent's update function if provided
      if (onSubtaskUpdate) {
        await onSubtaskUpdate(subtaskId, newCompleted);
      }
    } catch (error) {
      console.error('Error updating subtask completion:', error);
    } finally {
      // Remove loading state
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this subtask? This action cannot be undone.')) {
      setDeletingId(subtaskId);
      try {
        await onDelete(subtaskId);
      } catch (error) {
        console.error('Error deleting subtask:', error);
        alert('Failed to delete subtask. Please try again.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Urgent';
      case 'medium':
        return 'High';
      default:
        return 'Regular';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dueDate: string) => {
    try {
      const today = new Date();
      const due = new Date(dueDate);
      // Set time to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < today;
    } catch {
      return false;
    }
  };

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-md font-semibold text-gray-700">SUBTASKS</h3>
            <span className="text-xs text-gray-500 uppercase tracking-wide italic">
              {/* Check them off as you complete them! */}
            </span>
          </div>          
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">NAME</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">ASSIGNEE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">DUE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">PRIORITY</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide w-12">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {subtasks.map((subtask, index) => (
              <tr key={subtask.id} className="border-b border-gray-200 bg-white">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTaskCompletion(subtask.id)}
                      disabled={updatingTasks.has(subtask.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                        subtask.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      } ${updatingTasks.has(subtask.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {updatingTasks.has(subtask.id) ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : subtask.completed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                      )}
                    </button>
                    <div className={`${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                      <div className="font-medium text-gray-900">{subtask.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {subtask.assignees && subtask.assignees.length > 0 ? (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {subtask.assignees.slice(0, 4).map((assignee, index) => (
                          <div 
                            key={index}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white relative group cursor-pointer ${
                              subtask.completed 
                                ? 'bg-gray-100 text-gray-400' 
                                : 'bg-gray-300 text-gray-700'
                            }`}
                            title={assignee}
                          >
                            {assignee.charAt(0).toUpperCase()}
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              {assignee}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        ))}
                        {subtask.assignees.length > 4 && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white relative group cursor-pointer ${
                            subtask.completed 
                              ? 'bg-white text-gray-400' 
                              : 'bg-white text-gray-700'
                          }`}>
                            +{subtask.assignees.length - 4}
                            {/* Tooltip for remaining users */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              {subtask.assignees.slice(4).join(', ')}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {subtask.dueDate ? (
                    <span className={`text-sm ${subtask.completed ? 'text-gray-400 line-through' : isOverdue(subtask.dueDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDate(subtask.dueDate)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subtask.completed ? 'text-gray-400 bg-gray-100' : getPriorityColor(subtask.priority)}`}>
                    {getPriorityLabel(subtask.priority)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {onDelete && (
                    <button
                      onClick={() => handleDelete(subtask.id)}
                      disabled={deletingId === subtask.id}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete subtask"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CentralizedSubtaskTable;
