import React, { useState, useRef, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, files: File[], mentionedUsers: User[]) => void;
  teamMembers: User[];
  currentUser: User;
}

const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
  currentUser
}) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File size limit: 1GB
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB in bytes

  // Filter team members based on mention query
  const filteredMembers = teamMembers.filter(member => 
    member.id !== currentUser.id && 
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      files.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB)`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (invalidFiles.length > 0) {
        alert(`Some files exceed 1GB limit:\n${invalidFiles.join('\n')}`);
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      files.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name} (${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB)`);
        } else {
          validFiles.push(file);
        }
      });
      
      if (invalidFiles.length > 0) {
        alert(`Some files exceed 1GB limit:\n${invalidFiles.join('\n')}`);
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

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

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Call the onSubmit function with the files (content can be empty)
      await onSubmit(content.trim() || '', selectedFiles, mentionedUsers);
      
      setUploadProgress(100);
      setTimeout(() => {
        setContent('');
        setSelectedFiles([]);
        setMentionedUsers([]);
        setShowMentions(false);
        setIsUploading(false);
        setUploadProgress(0);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isUploading) {
      setContent('');
      setSelectedFiles([]);
      setMentionedUsers([]);
      setShowMentions(false);
      setUploadProgress(0);
      onClose();
    }
  };

  // Remove a file from the selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Media</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 flex-1 space-y-4">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Media File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                />
                {selectedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllFiles();
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">Click to upload or drag and drop</div>
                    <div className="text-xs text-gray-500">All file types supported • Max file size: 1GB</div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Content Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a description (optional)
              </label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Describe your media... @mention a user to notify them."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ minHeight: '120px' }}
                disabled={isUploading}
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
              <div>
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
                        disabled={isUploading}
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
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMediaModal;
