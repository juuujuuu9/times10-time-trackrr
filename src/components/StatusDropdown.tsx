import { useState, useRef, useEffect } from 'react';

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  taskId: number;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
];

export default function StatusDropdown({ currentStatus, onStatusChange, taskId, disabled = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = statusOptions.find(option => option.value === localStatus) || statusOptions[0];

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
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setLocalStatus(newStatus);
        onStatusChange(newStatus);
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStatusUpdated', {
          detail: { taskId, newStatus }
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to update task status:', errorData);
        // You could add a toast notification here
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
    <div className="relative" ref={dropdownRef}>
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
          className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
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
