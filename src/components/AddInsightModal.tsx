import React, { useState, useRef, useEffect } from 'react';
import BasicTiptapEditor from './BasicTiptapEditor';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface AddInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, mentionedUsers: User[]) => void;
  teamMembers: User[];
  currentUser: User;
  initialContent?: string;
  initialMentionedUsers?: User[];
}

const AddInsightModal: React.FC<AddInsightModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
  currentUser,
  initialContent,
  initialMentionedUsers
}) => {
  const [content, setContent] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);

  // Handle mentioned users change
  const handleMentionedUsersChange = (users: User[]) => {
    setMentionedUsers(users);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), mentionedUsers);
      setContent('');
      setMentionedUsers([]);
      onClose();
    }
  };

  // Handle modal close
  const handleClose = () => {
    setContent('');
    setMentionedUsers([]);
    onClose();
  };

  // Handle initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      // Seed initial content/mentions if provided
      if (initialContent !== undefined) {
        setContent(initialContent);
      }
      if (initialMentionedUsers !== undefined) {
        setMentionedUsers(initialMentionedUsers);
      }
    }
  }, [isOpen, initialContent, initialMentionedUsers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Insight</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 flex-1">
            <BasicTiptapEditor
              content={content}
              onChange={setContent}
              placeholder="What do you want to share? Use the toolbar above to format your text."
              className="w-full"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Insight
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInsightModal;
