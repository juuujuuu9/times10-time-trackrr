import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Edit3 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Subtask {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
  assignees?: string[];
  dueDate?: string;
  completed?: boolean;
}

interface SubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubtasks: (subtasks: Omit<Subtask, 'id'>[]) => void;
  teamMembers: User[];
}

const SubtaskModal: React.FC<SubtaskModalProps> = ({ isOpen, onClose, onCreateSubtasks, teamMembers }) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    {
      id: '1',
      name: '',
      priority: 'medium',
      assignees: [],
      dueDate: '',
      completed: false
    }
  ]);

  const addSubtask = useCallback(() => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      name: '',
      priority: 'medium',
      assignees: [],
      dueDate: '',
      completed: false
    };
    setSubtasks(prev => [...prev, newSubtask]);
  }, []);

  const removeSubtask = useCallback((id: string) => {
    setSubtasks(prev => prev.filter(subtask => subtask.id !== id));
  }, []);

  const updateSubtask = useCallback((id: string, field: keyof Subtask, value: string | string[]) => {
    setSubtasks(prev => prev.map(subtask => 
      subtask.id === id ? { ...subtask, [field]: value } : subtask
    ));
  }, []);

  const toggleAssignee = useCallback((subtaskId: string, assigneeName: string) => {
    setSubtasks(prev => prev.map(subtask => {
      if (subtask.id !== subtaskId) return subtask;
      
      const currentAssignees = subtask.assignees || [];
      const isAssigned = currentAssignees.includes(assigneeName);
      
      return {
        ...subtask,
        assignees: isAssigned 
          ? currentAssignees.filter(name => name !== assigneeName)
          : [...currentAssignees, assigneeName]
      };
    }));
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
      assignees: subtask.assignees || [],
      dueDate: subtask.dueDate || undefined
    }));

    onCreateSubtasks(subtasksToCreate);
    setSubtasks([{
      id: '1',
      name: '',
      priority: 'medium',
      assignees: [],
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
      assignees: [],
      dueDate: '',
      completed: false
    }]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                        <td className="py-0 px-0">
                          <input
                            type="text"
                            value={subtask.name}
                            onChange={(e) => updateSubtask(subtask.id, 'name', e.target.value)}
                            placeholder="Subtask name"
                            className="w-full px-3 py-5 border border-t-0 border-l-0 border-b-0 border-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                        </td>
                        <td className="py-0 px-0">
                          <select
                            value={subtask.priority}
                            onChange={(e) => updateSubtask(subtask.id, 'priority', e.target.value)}
                            className="w-full min-w-[7rem] px-3 py-5 border border-t-0 border-l-0 border-b-0 border-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="py-0 px-0">
                          <div className="w-full px-3 py-3 border border-t-0 border-l-0 border-b-0 border-gray-100">
                            {/* Selected Assignees - Overlapping Circular Avatars */}
                            <div className="flex items-center">
                              <div className="flex -space-x-2">
                                {(subtask.assignees || []).slice(0, 4).map((assignee, index) => (
                                  <div 
                                    key={index}
                                    className="w-8 h-8 bg-green-300 rounded-full flex items-center justify-center text-xs font-medium text-green-800 border-2 border-white relative group cursor-pointer"
                                    title={assignee}
                                    onClick={() => toggleAssignee(subtask.id, assignee)}
                                  >
                                    {assignee.charAt(0).toUpperCase()}
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                      {assignee} (click to remove)
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                ))}
                                {(subtask.assignees || []).length > 4 && (
                                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white relative group cursor-pointer">
                                    +{(subtask.assignees || []).length - 4}
                                    {/* Tooltip for remaining users */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                      {(subtask.assignees || []).slice(4).join(', ')}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Available Team Members */}
                            <div className="flex flex-wrap gap-1">
                              {teamMembers
                                .filter(member => !(subtask.assignees || []).includes(member.name))
                                .map((member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => toggleAssignee(subtask.id, member.name)}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800 transition-colors"
                                >
                                  + {member.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-0 px-0">
                          <input
                            type="date"
                            value={subtask.dueDate}
                            onChange={(e) => updateSubtask(subtask.id, 'dueDate', e.target.value)}
                            className="w-full px-3 py-3 border border-t-0 border-b-0 border-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                        </td>
                        <td className="py-0 px-4">
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
