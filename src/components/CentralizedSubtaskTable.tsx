import React from 'react';
import { Circle, User, Calendar } from 'lucide-react';

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
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Circle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Circle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
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

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Subtasks</h3>
          <span className="text-sm text-gray-500">
            {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
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
              <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Assignee</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {subtasks.map((subtask, index) => (
              <tr key={subtask.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="py-3 px-4">
                  {getPriorityIcon(subtask.priority)}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{subtask.name}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(subtask.priority)}`}>
                    {subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {subtask.assignee ? (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{subtask.assignee}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {subtask.dueDate ? (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{formatDate(subtask.dueDate)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
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
