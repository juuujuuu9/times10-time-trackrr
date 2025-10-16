import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Edit3 } from 'lucide-react';

interface Subtask {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  completed?: boolean;
}

interface SubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtasks: (subtasks: Omit<Subtask, 'id'>[]) => void;
}

const SubtaskModal: React.FC<SubtaskModalProps> = ({ isOpen, onClose, onCreateSubtasks }) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    {
      id: '1',
      name: '',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      completed: false
    }
  ]);

  const addSubtask = useCallback(() => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      name: '',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      completed: false
    };
    setSubtasks(prev => [...prev, newSubtask]);
  }, []);

  const removeSubtask = useCallback((id: string) => {
    setSubtasks(prev => prev.filter(subtask => subtask.id !== id));
  }, []);

  const updateSubtask = useCallback((id: string, field: keyof Subtask, value: string) => {
    setSubtasks(prev => prev.map(subtask => 
      subtask.id === id ? { ...subtask, [field]: value } : subtask
    ));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty subtasks
    const validSubtasks = subtasks.filter(subtask => 
      subtask.name.trim() !== ''
    );

    if (validSubtasks.length === 0) {
      return;
    }

    // Convert to the format expected by the parent
    const subtasksToCreate = validSubtasks.map(subtask => ({
      name: subtask.name,
      priority: subtask.priority,
      assignee: subtask.assignee || undefined,
      dueDate: subtask.dueDate || undefined
    }));

    onCreateSubtasks(subtasksToCreate);
    setSubtasks([{
      id: '1',
      name: '',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      completed: false
    }]);
    onClose();
  }, [subtasks, onCreateSubtasks, onClose]);

  const handleClose = useCallback(() => {
    setSubtasks([{
      id: '1',
      name: '',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      completed: false
    }]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Edit3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create Subtasks</h2>
              <p className="text-sm text-gray-500">Break down the task into manageable subtasks</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subtasks Table */}
            <div className="space-y-4">
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Priority</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Assignee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subtasks.map((subtask, index) => (
                      <tr key={subtask.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={subtask.name}
                            onChange={(e) => updateSubtask(subtask.id, 'name', e.target.value)}
                            placeholder="Subtask name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={subtask.priority}
                            onChange={(e) => updateSubtask(subtask.id, 'priority', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={subtask.assignee}
                            onChange={(e) => updateSubtask(subtask.id, 'assignee', e.target.value)}
                            placeholder="Assignee"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={subtask.dueDate}
                            onChange={(e) => updateSubtask(subtask.id, 'dueDate', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {subtasks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubtask(subtask.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="flex items-center justify-end w-full">
                {/* <h3 className="text-lg font-medium text-gray-900">Subtasks</h3> */}
                 <button
                   type="button"
                   onClick={addSubtask}
                   className="flex items-center space-x-2 px-3 py-2 bg-white border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                 >
                  <Plus className="w-4 h-4" />
                  <span>Add Subtask</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors"
          >
            Create Subtasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtaskModal;
