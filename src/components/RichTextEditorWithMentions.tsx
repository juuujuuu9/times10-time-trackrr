import React, { useState, useRef, useCallback, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface RichTextEditorWithMentionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  teamMembers: User[];
  currentUser: User;
  onMentionedUsersChange?: (users: User[]) => void;
  initialMentionedUsers?: User[];
}

const RichTextEditorWithMentions: React.FC<RichTextEditorWithMentionsProps> = ({
  value,
  onChange,
  placeholder = "Write your message...",
  className = "",
  rows = 4,
  disabled = false,
  teamMembers,
  currentUser,
  onMentionedUsersChange,
  initialMentionedUsers = []
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>(initialMentionedUsers);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Filter team members based on mention query
  const filteredMembers = teamMembers.filter(member => 
    member.id !== currentUser.id && 
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

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
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const beforeAt = textBeforeCursor.substring(0, atMatch.index);
      const mentionName = formatMentionName(user);
      const newContent = `${beforeAt}@${mentionName} ${textAfterCursor}`;
      onChange(newContent);
      setShowMentions(false);
      const newMentionedUsers = [...mentionedUsers.filter(u => u.id !== user.id), user];
      setMentionedUsers(newMentionedUsers);
      onMentionedUsersChange?.(newMentionedUsers);
      
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

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Bold: Ctrl/Cmd + B
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'bold text');
    }
    // Italic: Ctrl/Cmd + I
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'italic text');
    }
    // Strikethrough: Ctrl/Cmd + Shift + S
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      insertFormatting('~~', '~~', 'strikethrough text');
    }
    // Code: Ctrl/Cmd + E
    else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      insertFormatting('`', '`', 'code');
    }
    // Handle mention dropdown
    else if (showMentions) {
      if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  // Formatting functions
  const insertFormatting = useCallback((before: string, after: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after the formatting
    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText || placeholder).length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const insertBulletList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // If text is selected, convert each line to a bullet point
    if (selectedText) {
      const lines = selectedText.split('\n');
      const bulletedLines = lines.map(line => line.trim() ? `• ${line.trim()}` : '• ').join('\n');
      const newText = value.substring(0, start) + bulletedLines + value.substring(end);
      onChange(newText);
    } else {
      // Insert a new bullet point
      const newText = value.substring(0, start) + '• ' + value.substring(end);
      onChange(newText);
    }
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const insertNumberedList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // If text is selected, convert each line to a numbered point
    if (selectedText) {
      const lines = selectedText.split('\n');
      const numberedLines = lines.map((line, index) => 
        line.trim() ? `${index + 1}. ${line.trim()}` : `${index + 1}. `
      ).join('\n');
      const newText = value.substring(0, start) + numberedLines + value.substring(end);
      onChange(newText);
    } else {
      // Insert a new numbered point
      const newText = value.substring(0, start) + '1. ' + value.substring(end);
      onChange(newText);
    }
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const insertCodeBlock = useCallback(() => {
    insertFormatting('```\n', '\n```', 'code');
  }, [insertFormatting]);

  const insertQuote = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const lines = selectedText.split('\n');
      const quotedLines = lines.map(line => line.trim() ? `> ${line.trim()}` : '> ').join('\n');
      const newText = value.substring(0, start) + quotedLines + value.substring(end);
      onChange(newText);
    } else {
      const newText = value.substring(0, start) + '> ' + value.substring(end);
      onChange(newText);
    }
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const insertLink = useCallback(() => {
    insertFormatting('[', '](url)', 'link text');
  }, [insertFormatting]);

  const insertHorizontalRule = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + '\n\n---\n\n' + value.substring(start);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      {isFocused && (
        <div className="absolute top-2 right-2 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center space-x-1">
          {/* Bold */}
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 hover:bg-gray-100 rounded text-sm font-bold"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          
          {/* Italic */}
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 hover:bg-gray-100 rounded text-sm italic"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          
          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~', 'strikethrough text')}
            className="p-1.5 hover:bg-gray-100 rounded text-sm line-through"
            title="Strikethrough (Ctrl+Shift+S)"
          >
            <span className="line-through">S</span>
          </button>
          
          {/* Code */}
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            className="p-1.5 hover:bg-gray-100 rounded text-sm font-mono bg-gray-100"
            title="Code (Ctrl+E)"
          >
            &lt;/&gt;
          </button>
          
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          
          {/* Bullet List */}
          <button
            type="button"
            onClick={insertBulletList}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          
          {/* Numbered List */}
          <button
            type="button"
            onClick={insertNumberedList}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Numbered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </button>
          
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          
          {/* Quote */}
          <button
            type="button"
            onClick={insertQuote}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Quote"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          
          {/* Code Block */}
          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Code Block"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          
          {/* Link */}
          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          
          {/* Horizontal Rule */}
          <button
            type="button"
            onClick={insertHorizontalRule}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Horizontal Rule"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      
      {/* Mention suggestions dropdown */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto">
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

      {/* Mentioned users display */}
      {mentionedUsers.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-600 mb-1">Mentioned:</div>
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
    </div>
  );
};

export default RichTextEditorWithMentions;
