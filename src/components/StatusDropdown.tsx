import { useState, useRef, useEffect } from 'react';

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
  taskId: number;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: 'pending' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: 'in_progress' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: 'completed' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800', icon: 'on_hold' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: 'cancelled' }
];

export default function StatusDropdown({ currentStatus, onStatusChange, taskId, disabled = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = statusOptions.find(option => option.value === localStatus) || statusOptions[0];

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">...</text>
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'on_hold':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync local status with prop changes
  useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === localStatus || isUpdating) return;

    // Close dropdown immediately when selection is made
    setIsOpen(false);
    setIsUpdating(true);
    
    try {
      // If onStatusChange callback is provided, use it (for subtasks)
      if (onStatusChange) {
        await onStatusChange(newStatus);
        setLocalStatus(newStatus);
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStatusUpdated', {
          detail: { taskId, newStatus }
        }));
      } else {
        // Fallback to direct API call (for main tasks)
        const response = await fetch(`/api/admin/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setLocalStatus(newStatus);
          
          // Dispatch custom event for real-time updates
          window.dispatchEvent(new CustomEvent('taskStatusUpdated', {
            detail: { taskId, newStatus }
          }));
        } else {
          const errorData = await response.json();
          console.error('Failed to update task status:', errorData);
          // You could add a toast notification here
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
      // Ensure dropdown is closed even on error
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, status: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStatusChange(status);
    }
  };

  return (
    <div className="relative" ref={dropdownRef} data-status-dropdown>
      <button
        type="button"
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentOption.color} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
        } transition-opacity`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Change task status. Current status: ${currentOption.label}`}
        role="combobox"
      >
        {renderStatusIcon(localStatus)}
        {currentOption.label}
        {!disabled && (
          <svg 
            className={`ml-1 w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && !disabled && (
        <div 
          className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
          role="listbox"
          aria-label="Task status options"
        >
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
              Statuses
            </div>
            {statusOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={`w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none ${
                  option.value === localStatus ? 'bg-gray-50' : ''
                }`}
                onClick={() => handleStatusChange(option.value)}
                onKeyDown={(e) => handleKeyDown(e, option.value)}
                disabled={isUpdating}
                role="option"
                aria-selected={option.value === localStatus}
                tabIndex={0}
                aria-label={`Set status to ${option.label}`}
              >
                {renderStatusIcon(option.value)}
                <span className="flex-1">{option.label}</span>
                {option.value === localStatus && (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
