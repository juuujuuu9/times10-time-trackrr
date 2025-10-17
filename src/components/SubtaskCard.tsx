import React, { useState } from 'react';
import { CheckCircle, Clock, Circle, User, Calendar, Trash2 } from 'lucide-react';

interface Subtask {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  assignees?: string[];
  dueDate?: string;
}

interface SubtaskCardProps {
  subtasks: Subtask[];
  className?: string;
  taskId?: number;
  onDelete?: (subtaskId: string) => void;
}

const SubtaskCard: React.FC<SubtaskCardProps> = ({ subtasks, className = '', taskId, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'on_hold':
        return <Circle className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <Circle className="w-4 h-4 text-red-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'on_hold':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
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

  const handleDelete = async (subtaskId: string) => {
    if (!taskId || !onDelete) return;
    
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

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Subtasks</h3>
          <span className="text-sm text-gray-500">
            {subtasks.length} subtasks
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-8"></th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Assignee</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subtasks.map((subtask, index) => (
              <tr key={subtask.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-3 px-4">
                  {getStatusIcon(subtask.status)}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{subtask.name}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subtask.status)}`}>
                    {subtask.status.charAt(0).toUpperCase() + subtask.status.slice(1).replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {subtask.assignees && subtask.assignees.length > 0 ? (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {subtask.assignees.slice(0, 4).map((assignee, index) => (
                          <div 
                            key={index}
                            className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white relative group cursor-pointer"
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
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white relative group cursor-pointer">
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
                    <div className="flex items-center space-x-2">
                      <Calendar className={`w-4 h-4 ${isOverdue(subtask.dueDate) ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isOverdue(subtask.dueDate) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                        {formatDate(subtask.dueDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
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

export default SubtaskCard;
