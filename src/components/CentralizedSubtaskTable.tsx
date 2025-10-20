import React, { useState, useEffect } from 'react';
import { FileText, User, Calendar, Check, Trash2, X } from 'lucide-react';
import StatusDropdown from './StatusDropdown';

interface Subtask {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
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
  onStatusUpdate?: (subtaskId: string, status: string) => void;
  onDelete?: (subtaskId: string) => void;
  onAssigneeUpdate?: (subtaskId: string, assignees: string[]) => void;
  teamMembers?: Array<{ id: number; name: string; email: string }>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const CentralizedSubtaskTable: React.FC<CentralizedSubtaskTableProps> = ({ 
  subtasks, 
  className = '', 
  collaborationId, 
  taskId, 
  onSubtaskUpdate,
  onStatusUpdate,
  onDelete,
  onAssigneeUpdate,
  teamMembers = []
}) => {
  console.log('🔍 CentralizedSubtaskTable props:', { subtasks: subtasks?.length, onDelete: !!onDelete, collaborationId, taskId });
  
  // Debug subtask IDs
  if (subtasks && subtasks.length > 0) {
    const invalidSubtasks = subtasks.filter(subtask => !subtask.id || subtask.id === '0' || subtask.id === 0);
    if (invalidSubtasks.length > 0) {
      console.warn('⚠️ Found subtasks with invalid IDs:', invalidSubtasks);
    }
  }
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showAssigneePopup, setShowAssigneePopup] = useState<string | null>(null);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
  const [updatingAssignees, setUpdatingAssignees] = useState<Set<string>>(new Set());
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
        addNotification('success', `Subtask ${newCompleted ? 'completed' : 'reopened'} successfully`);
      }
    } catch (error) {
      console.error('Error updating subtask completion:', error);
      addNotification('error', 'Failed to update subtask. Please try again.');
    } finally {
      // Remove loading state
      setUpdatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const handleDeleteClick = (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;
    
    setSubtaskToDelete({ id: subtaskId, name: subtask.name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !subtaskToDelete) return;
    
    setDeletingId(subtaskToDelete.id);
    try {
      await onDelete(subtaskToDelete.id);
      addNotification('success', 'Subtask deleted successfully');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      addNotification('error', 'Failed to delete subtask. Please try again.');
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setSubtaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSubtaskToDelete(null);
  };

  const handleRemoveAssignee = async (subtaskId: string, assigneeName: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask || !onAssigneeUpdate) return;

    const updatedAssignees = (subtask.assignees || []).filter(name => name !== assigneeName);
    
    setUpdatingAssignees(prev => new Set(prev).add(subtaskId));
    
    try {
      await onAssigneeUpdate(subtaskId, updatedAssignees);
      addNotification('success', `${assigneeName} removed from subtask`);
    } catch (error) {
      console.error('Error removing assignee:', error);
      addNotification('error', 'Failed to remove assignee. Please try again.');
    } finally {
      setUpdatingAssignees(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const handleAddAssignee = async (subtaskId: string, assigneeName: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask || !onAssigneeUpdate) return;

    const currentAssignees = subtask.assignees || [];
    if (currentAssignees.includes(assigneeName)) {
      addNotification('info', `${assigneeName} is already assigned to this subtask`);
      return;
    }

    const updatedAssignees = [...currentAssignees, assigneeName];
    
    setUpdatingAssignees(prev => new Set(prev).add(subtaskId));
    
    try {
      await onAssigneeUpdate(subtaskId, updatedAssignees);
      addNotification('success', `${assigneeName} added to subtask`);
      setShowAssigneePopup(null);
      setAssigneeSearchTerm('');
      setPopupPosition(null);
    } catch (error) {
      console.error('Error adding assignee:', error);
      addNotification('error', 'Failed to add assignee. Please try again.');
    } finally {
      setUpdatingAssignees(prev => {
        const newSet = new Set(prev);
        newSet.delete(subtaskId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (subtaskId: string, newStatus: string) => {
    if (!onStatusUpdate) return;
    
    try {
      await onStatusUpdate(subtaskId, newStatus);
      addNotification('success', 'Subtask status updated successfully');
    } catch (error) {
      console.error('Error updating subtask status:', error);
      addNotification('error', 'Failed to update subtask status. Please try again.');
    }
  };

  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase()) &&
    !subtasks.find(s => s.id === showAssigneePopup)?.assignees?.includes(member.name)
  );

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAssigneePopup && !(event.target as Element).closest('.assignee-popup-container')) {
        setShowAssigneePopup(null);
        setAssigneeSearchTerm('');
        setPopupPosition(null);
      }
    };

    if (showAssigneePopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAssigneePopup]);


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
      <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">NAME</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">ASSIGNEE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">DUE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 uppercase text-xs tracking-wide">STATUS</th>
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
                  <div className="flex items-center space-x-2 relative">
                    {subtask.assignees && subtask.assignees.length > 0 ? (
                      <div className="flex -space-x-2">
                        {subtask.assignees.slice(0, 4).map((assignee, index) => (
                          <div 
                            key={index}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white relative group hover:bg-gray-400 hover:z-50 transition-colors duration-200 ${
                              subtask.completed 
                                ? 'bg-gray-100 text-gray-400' 
                                : 'bg-gray-300 text-gray-700'
                            } ${updatingAssignees.has(subtask.id) ? 'opacity-50' : ''}`}
                            title={assignee}
                          >
                            {assignee.charAt(0).toUpperCase()}
                            {/* Remove button (hidden by default) */}
                            {onAssigneeUpdate && !subtask.completed && (
                              <button 
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 cursor-pointer"
                                title={`Remove ${assignee} from subtask`}
                                onClick={() => handleRemoveAssignee(subtask.id, assignee)}
                                disabled={updatingAssignees.has(subtask.id)}
                              >
                                ×
                              </button>
                            )}
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
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                    
                    {/* Add User Button for Subtask */}
                    {onAssigneeUpdate && !subtask.completed && (
                      <div className="relative assignee-popup-container">
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopupPosition({
                              top: rect.bottom + window.scrollY + 4,
                              left: rect.left + window.scrollX
                            });
                            setShowAssigneePopup(subtask.id);
                          }}
                          disabled={updatingAssignees.has(subtask.id)}
                          className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add assignee"
                        >
                          +
                        </button>
                        
                        {/* Assignee Popup */}
                        {showAssigneePopup === subtask.id && popupPosition && (
                          <div 
                            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-64 assignee-popup-container"
                            style={{
                              top: `${popupPosition.top}px`,
                              left: `${popupPosition.left}px`,
                              zIndex: 9999
                            }}
                          >
                            <div className="p-3 border-b border-gray-200">
                              <input
                                type="text"
                                placeholder="Search team members..."
                                value={assigneeSearchTerm}
                                onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredTeamMembers.length > 0 ? (
                                filteredTeamMembers.map((member) => (
                                  <button
                                    key={member.id}
                                    onClick={() => handleAddAssignee(subtask.id, member.name)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{member.name}</div>
                                    <div className="text-xs text-gray-500">{member.email}</div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">No team members found</div>
                              )}
                            </div>
                            <div className="p-2 border-t border-gray-200">
                              <button
                                onClick={() => {
                                  setShowAssigneePopup(null);
                                  setAssigneeSearchTerm('');
                                  setPopupPosition(null);
                                }}
                                className="w-full px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  {subtask.id && subtask.id !== '0' && subtask.id !== 0 ? (
                    <StatusDropdown
                      currentStatus={subtask.status || 'pending'}
                      onStatusChange={(newStatus) => handleStatusUpdate(subtask.id, newStatus)}
                      taskId={subtask.id}
                      disabled={subtask.completed}
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Invalid subtask ID</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {onDelete && (
                    <button
                      onClick={() => handleDeleteClick(subtask.id)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && subtaskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Remove Subtask</h3>
              <button
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to remove <span className="font-semibold">"{subtaskToDelete.name}"</span>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingId === subtaskToDelete.id}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === subtaskToDelete.id ? 'Removing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center justify-between p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : notification.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === 'success'
                    ? 'bg-green-500'
                    : notification.type === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}></div>
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CentralizedSubtaskTable;
