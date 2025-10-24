import React, { useRef, useEffect, useState } from 'react';
import { uploadDirectlyToBunnyCdn } from '../utils/bunnyCdnDirect';

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
  // Props for image upload
  collaborationId?: number;
  taskId?: number;
  clientName?: string;
  projectName?: string;
}

const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({
  content,
  onChange,
  placeholder = "Write your message...",
  className = "",
  teamMembers = [],
  currentUser,
  onMentionedUsersChange,
  initialMentionedUsers = [],
  collaborationId,
  taskId,
  clientName,
  projectName
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    console.log('🔍 SimpleRichEditor: handleMentionSelect called with user:', user);
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
      
      console.log('🔍 SimpleRichEditor: mention detection:', { textBeforeCursor, atMatch, user });
      
      if (atMatch) {
        const beforeAt = textBeforeCursor.substring(0, atMatch.index);
        const mentionName = formatMentionName(user);
        const newText = `${beforeAt}@${mentionName} ${textAfterCursor}`;
        
        console.log('🔍 SimpleRichEditor: creating mention:', { mentionName, newText });
        
        // Update the text node
        textNode.textContent = newText;
        
        // Update the content
        const newContent = editorRef.current.innerHTML;
        onChange(newContent);
        
        setShowMentions(false);
        const newMentionedUsers = [...mentionedUsers.filter(u => u.id !== user.id), user];
        setMentionedUsers(newMentionedUsers);
        console.log('🔍 SimpleRichEditor: calling onMentionedUsersChange with:', newMentionedUsers);
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

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 10MB for inline images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Image file is too large. Please select an image smaller than 10MB.');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Use collaboration and task info for organized file structure
      const folder = collaborationId && taskId 
        ? `collaborations/${collaborationId}/tasks/${taskId}/inline-images`
        : 'inline-images';
      
      const uploadResult = await uploadDirectlyToBunnyCdn(
        file,
        folder,
        undefined, // Let Bunny CDN generate a unique filename
        clientName || 'Unknown Client',
        projectName || 'Unknown Project'
      );

      if (uploadResult.success && uploadResult.url) {
        // Insert the image into the editor at the current cursor position
        insertImageAtCursor(uploadResult.url, file.name);
      } else {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Insert image at current cursor position
  const insertImageAtCursor = (imageUrl: string, altText: string) => {
    if (!editorRef.current) return;

    // Create image element
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = altText;
    img.className = 'inline-image max-w-full h-auto rounded-lg';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '8px 0';
    img.style.borderRadius = '8px';
    img.style.display = 'block';

    // Get current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Insert the image
      range.deleteContents();
      range.insertNode(img);
      
      // Move cursor after the image
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // If no selection, append to the end
      editorRef.current.appendChild(img);
    }

    // Update content
    onChange(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  // Trigger file input click
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
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
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M2 1H8.625C11.0412 1 13 2.95875 13 5.375C13 6.08661 12.8301 6.75853 12.5287 7.35243C13.4313 8.15386 14 9.32301 14 10.625C14 13.0412 12.0412 15 9.625 15H2V1ZM5.5 9.75V11.5H9.625C10.1082 11.5 10.5 11.1082 10.5 10.625C10.5 10.1418 10.1082 9.75 9.625 9.75H5.5ZM5.5 6.25H8.625C9.10825 6.25 9.5 5.85825 9.5 5.375C9.5 4.89175 9.10825 4.5 8.625 4.5H5.5V6.25Z" fill="currentColor" />
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
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 1H5V4H7.75219L5.08553 12H2V15H11V12H8.24781L10.9145 4H14V1Z" fill="currentColor" />
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
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 1V7C3 9.76142 5.23858 12 8 12C10.7614 12 13 9.76142 13 7V1H10V7C10 8.10457 9.10457 9 8 9C6.89543 9 6 8.10457 6 7V1H3Z" fill="currentColor" />
            <path d="M14 16V14H2V16H14Z" fill="currentColor" />
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
          <svg className="w-4 h-4" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="302.748,220.383 302.748,126.887 407.374,126.887 407.374,55.652 104.626,55.652 104.626,126.887 209.252,126.887 209.252,220.383 0,220.383 0,293.844 209.252,293.844 209.252,456.348 302.748,456.348 302.748,293.844 512,293.844 512,220.383" fill="currentColor" />
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
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 1H1V3H3V1Z" fill="currentColor" />
            <path d="M3 5H1V7H3V5Z" fill="currentColor" />
            <path d="M1 9H3V11H1V9Z" fill="currentColor" />
            <path d="M3 13H1V15H3V13Z" fill="currentColor" />
            <path d="M15 1H5V3H15V1Z" fill="currentColor" />
            <path d="M15 5H5V7H15V5Z" fill="currentColor" />
            <path d="M5 9H15V11H5V9Z" fill="currentColor" />
            <path d="M15 13H5V15H15V13Z" fill="currentColor" />
          </svg>
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={insertOrderedList}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Ordered List"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.99999 1H15V3H6.99999V1Z" fill="currentColor" />
            <path d="M6.99999 5H15V7H6.99999V5Z" fill="currentColor" />
            <path d="M15 9H6.99999V11H15V9Z" fill="currentColor" />
            <path d="M6.99999 13H15V15H6.99999V13Z" fill="currentColor" />
            <path d="M3.28854 10.75H0.999993V9H3.28854C4.30279 9 5.12499 9.82221 5.12499 10.8364C5.12499 11.3407 4.91763 11.8228 4.55155 12.1696L3.41116 13.25H4.99999V15H0.999993V13.1236L3.348 10.8992C3.36523 10.8829 3.37499 10.8602 3.37499 10.8364C3.37499 10.7887 3.33629 10.75 3.28854 10.75Z" fill="currentColor" />
            <path d="M2.358 1.125L0.723297 1.6699L1.2767 3.3301L2.125 3.04733V7H3.875V1.125H2.358Z" fill="currentColor" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Image Upload */}
        <button
          type="button"
          onClick={triggerImageUpload}
          disabled={isUploadingImage}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Insert Image"
        >
          {isUploadingImage ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          )}
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Link"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.4481 1.50023C14.844 1.4862 13.3007 2.10727 12.15 3.22645L12.1351 3.24107L11.6464 3.7298C11.2559 4.12032 11.2559 4.75349 11.6464 5.14401L12.3535 5.85112C12.7441 6.24164 13.3772 6.24164 13.7677 5.85112L14.2484 5.37048C14.834 4.80437 15.6142 4.49305 16.4218 4.50012C17.2326 4.50721 18.0103 4.83463 18.5868 5.41517C19.1637 5.99606 19.4927 6.78402 19.4998 7.60991C19.5069 8.43176 19.1946 9.22174 18.633 9.81182L15.5209 12.9432C15.2056 13.2609 14.8269 13.5058 14.4107 13.6622C13.9945 13.8185 13.5501 13.8828 13.1076 13.8509C12.6651 13.8189 12.2341 13.6915 11.8438 13.4768C11.7456 13.4228 11.6504 13.3635 11.5588 13.2993C11.1066 12.9823 10.4859 12.8717 10.0425 13.201L9.23978 13.7973C8.79642 14.1266 8.69902 14.7603 9.09601 15.1443C9.48444 15.52 9.9219 15.8435 10.3977 16.1053C11.1664 16.5282 12.0171 16.78 12.8918 16.8431C13.7666 16.9062 14.6444 16.779 15.4656 16.4706C16.2868 16.1621 17.0317 15.6797 17.65 15.0568L20.7712 11.9162L20.7898 11.8971C21.9007 10.7389 22.5136 9.18987 22.4997 7.58402C22.4859 5.97817 21.8463 4.43996 20.7155 3.30127C19.5844 2.16225 18.0521 1.51427 16.4481 1.50023Z" fill="currentColor" />
            <path d="M11.1082 7.15685C10.2334 7.09376 9.35555 7.22089 8.53436 7.52937C7.71347 7.83773 6.96821 8.32053 6.34994 8.94317L3.22873 12.0838L3.21011 12.1029C2.09928 13.261 1.48637 14.8101 1.50023 16.416C1.51409 18.0218 2.15365 19.56 3.28441 20.6987C4.41551 21.8377 5.94781 22.4857 7.55185 22.4997C9.15591 22.5138 10.6993 21.8927 11.85 20.7735L11.8648 20.7589L12.3536 20.2701C12.7441 19.8796 12.7441 19.2465 12.3536 18.8559L11.6464 18.1488C11.2559 17.7583 10.6228 17.7583 10.2322 18.1488L9.75155 18.6295C9.16598 19.1956 8.38576 19.5069 7.5781 19.4999C6.76732 19.4928 5.98963 19.1653 5.41313 18.5848C4.83629 18.0039 4.50725 17.216 4.50012 16.3901C4.49303 15.5682 4.80532 14.7782 5.36694 14.1881L8.47904 11.0567C8.79434 10.7391 9.1731 10.4941 9.58932 10.3378C10.0055 10.1814 10.4498 10.1172 10.8924 10.1491C11.3349 10.181 11.7659 10.3084 12.1561 10.5231C12.2544 10.5772 12.3495 10.6365 12.4411 10.7007C12.8934 11.0177 13.5141 11.1282 13.9574 10.7989L14.7602 10.2026C15.2036 9.87328 15.301 9.23958 14.904 8.85563C14.5155 8.47995 14.0781 8.15644 13.6022 7.89464C12.8335 7.47172 11.9829 7.21993 11.1082 7.15685Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

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
        [contenteditable] .inline-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
          display: block;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        [contenteditable] .inline-image:hover {
          opacity: 0.9;
        }
        [contenteditable] .inline-image:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichEditor;
