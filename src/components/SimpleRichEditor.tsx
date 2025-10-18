import React, { useRef, useEffect, useState } from 'react';

interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
}

interface SimpleRichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  teamMembers?: User[];
  currentUser?: User;
  onMentionedUsersChange?: (users: User[]) => void;
  initialMentionedUsers?: User[];
}

const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your message...",
  className = "",
  teamMembers = [],
  currentUser,
  onMentionedUsersChange,
  initialMentionedUsers = []
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>(initialMentionedUsers);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Filter team members based on mention query
  const filteredMembers = teamMembers.filter(member => 
    member.id !== currentUser?.id && 
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Format user name for mention (FirstL format)
  const formatMentionName = (user: User): string => {
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
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const textContent = textNode.textContent || '';
      const cursorPos = range.startOffset;
      const textBeforeCursor = textContent.substring(0, cursorPos);
      const textAfterCursor = textContent.substring(cursorPos);
      const atMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (atMatch) {
        const beforeAt = textBeforeCursor.substring(0, atMatch.index);
        const mentionName = formatMentionName(user);
        const newText = `${beforeAt}@${mentionName} ${textAfterCursor}`;
        
        // Update the text node
        textNode.textContent = newText;
        
        // Update the content
        const newContent = editorRef.current.innerHTML;
        onChange(newContent);
        
        setShowMentions(false);
        const newMentionedUsers = [...mentionedUsers.filter(u => u.id !== user.id), user];
        setMentionedUsers(newMentionedUsers);
        onMentionedUsersChange?.(newMentionedUsers);
        
        // Set cursor position after the mention
        const newCursorPos = beforeAt.length + mentionName.length + 2;
        const newRange = document.createRange();
        newRange.setStart(textNode, newCursorPos);
        newRange.setEnd(textNode, newCursorPos);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      
      // Check for @ mentions
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          const cursorPos = range.startOffset;
          const textBeforeCursor = textContent.substring(0, cursorPos);
          const atMatch = textBeforeCursor.match(/@(\w*)$/);
          
          if (atMatch) {
            setMentionQuery(atMatch[1]);
            setShowMentions(true);
          } else {
            setShowMentions(false);
          }
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention navigation
    if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault();
      if (e.key === 'Escape') {
        setShowMentions(false);
      } else if (e.key === 'Enter' && filteredMembers.length > 0) {
        handleMentionSelect(filteredMembers[0]);
      }
      return;
    }
    
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateButtonStates();
  };

  const updateButtonStates = () => {
    if (editorRef.current) {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsStrikethrough(document.queryCommandState('strikeThrough'));
    }
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertBulletList = () => {
    execCommand('insertUnorderedList');
  };

  const insertOrderedList = () => {
    execCommand('insertOrderedList');
  };

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        {/* Bold */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            isBold ? 'bg-gray-200' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            isItalic ? 'bg-gray-200' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4L6 20M14 4l-4 16" />
          </svg>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            isUnderline ? 'bg-gray-200' : ''
          }`}
          title="Underline (Ctrl+U)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            isStrikethrough ? 'bg-gray-200' : ''
          }`}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l6 0" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Bullet List */}
        <button
          type="button"
          onClick={insertBulletList}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={insertOrderedList}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Ordered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Link */}
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onMouseUp={updateButtonStates}
          onKeyUp={updateButtonStates}
          className="prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3"
          style={{
            minHeight: '100px',
            outline: 'none',
          }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
        
        {/* Mention Dropdown */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredMembers.slice(0, 5).map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleMentionSelect(member)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
              >
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                  <div className="text-xs text-gray-500">@{formatMentionName(member)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Mentioned users display */}
      {mentionedUsers.length > 0 && (
        <div className="mt-2 p-3 bg-gray-50 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Mentioned:</div>
          <div className="flex flex-wrap gap-1">
            {mentionedUsers.map((user) => (
              <div
                key={user.id}
                className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs"
              >
                <span>@{formatMentionName(user)}</span>
                <button
                  type="button"
                  onClick={() => {
                    const newMentionedUsers = mentionedUsers.filter(u => u.id !== user.id);
                    setMentionedUsers(newMentionedUsers);
                    onMentionedUsersChange?.(newMentionedUsers);
                  }}
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
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichEditor;
