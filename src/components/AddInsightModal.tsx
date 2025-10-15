import React, { useState, useRef, useEffect } from 'react';

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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter team members based on mention query
  const filteredMembers = teamMembers.filter(member => 
    member.id !== currentUser.id && 
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContent(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Format user name for mention (FirstL format)
  const formatMentionName = (user: User) => {
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      return `${firstName}${lastName.charAt(0)}`;
    }
    return user.name; // Fallback to full name if only one name part
  };

  // Handle mention selection
  const handleMentionSelect = (user: User) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, atMatch.index);
      const mentionName = formatMentionName(user);
      const newContent = `${beforeAt}@${mentionName} ${textAfterCursor}`;
      setContent(newContent);
      setShowMentions(false);
      setMentionedUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeAt.length + mentionName.length + 2;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions) {
      if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
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
    setShowMentions(false);
    onClose();
  };

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      // Seed initial content/mentions if provided
      if (initialContent !== undefined) {
        setContent(initialContent);
      }
      if (initialMentionedUsers !== undefined) {
        setMentionedUsers(initialMentionedUsers);
      }
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Move caret to end
        const end = (initialContent ?? content).length;
        textareaRef.current.setSelectionRange(end, end);
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
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="What do you want to share? @mention a user to notify them."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ minHeight: '120px' }}
              />
              
              {/* Mention suggestions dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleMentionSelect(member)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mentioned users display */}
            {mentionedUsers.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Mentioned:</div>
                <div className="flex flex-wrap gap-2">
                  {mentionedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>@{formatMentionName(user)}</span>
                      <button
                        type="button"
                        onClick={() => setMentionedUsers(prev => prev.filter(u => u.id !== user.id))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
