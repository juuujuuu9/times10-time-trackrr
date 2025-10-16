import React, { useState } from 'react';
import { FileText, User, Calendar, Check } from 'lucide-react';

interface Subtask {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
}

interface CentralizedSubtaskTableProps {
  subtasks: Subtask[];
  className?: string;
}

const CentralizedSubtaskTable: React.FC<CentralizedSubtaskTableProps> = ({ subtasks, className = '' }) => {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
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
              Check them off as you go!
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
            </tr>
          </thead>
          <tbody>
            {subtasks.map((subtask, index) => (
              <tr key={subtask.id} className="border-b border-gray-200 bg-white">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTaskCompletion(subtask.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                        completedTasks.has(subtask.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {completedTasks.has(subtask.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                      )}
                    </button>
                    <div className={`${completedTasks.has(subtask.id) ? 'line-through text-gray-500' : ''}`}>
                      <div className="font-medium text-gray-900">{subtask.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {subtask.assignee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {subtask.assignee.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">{subtask.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {subtask.dueDate ? (
                    <span className={`text-sm ${isOverdue(subtask.dueDate) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {formatDate(subtask.dueDate)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(subtask.priority)}`}>
                    {getPriorityLabel(subtask.priority)}
                  </span>
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
