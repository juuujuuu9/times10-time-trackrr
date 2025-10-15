import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import AddInsightModal from './AddInsightModal';
import AddMediaModal from './AddMediaModal';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Post {
  id: number;
  type: 'insight' | 'media' | 'link' | 'subtask';
  content: string;
  author: User;
  createdAt: string;
  likes: number;
  comments: Comment[];
  mediaUrl?: string;
  mediaUrls?: string[]; // For multiple files
  fileNames?: string[]; // For multiple file names
  linkPreview?: {
    title: string;
    description: string;
    url: string;
    image?: string;
  };
  subtask?: {
    id: number;
    title: string;
    description: string;
    status: string;
  };
}

interface Comment {
  id: number;
  content: string;
  author: User;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

interface TaskStreamProps {
  taskId: number;
  collaborationId: number;
  currentUser: User;
  teamMembers: User[];
}

const TaskStream: React.FC<TaskStreamProps> = ({ 
  taskId, 
  collaborationId, 
  currentUser, 
  teamMembers 
}) => {
  console.log('TaskStream component mounted with props:', { taskId, collaborationId, currentUser, teamMembers });
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'insights' | 'media' | 'links' | 'subtasks'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [newComment, setNewComment] = useState<{ [postId: number]: string }>({});
  const [showAddInsightModal, setShowAddInsightModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);

  // Notification banners (in-DOM)
  // NOTE: Search for "Notification banners (in-DOM)" to find this system quickly.
  const [notifications, setNotifications] = useState<{ id: number; type: 'success' | 'error'; text: string }[]>([]);
  const addNotification = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);
  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Deletion confirmation (in-DOM)
  // NOTE: Search for "Deletion confirmation (in-DOM)" to find this system quickly.
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const requestDeletePost = (postId: number) => {
    setPendingDeleteId(postId);
  };
  const cancelDeletePost = () => setPendingDeleteId(null);

  // Inline post messages (per-post)
  // NOTE: Search for "Inline post messages (per-post)" to find this system quickly.
  const [postMessages, setPostMessages] = useState<{ [postId: number]: { type: 'success' | 'error'; text: string } | undefined }>({});
  const setInlinePostMessage = (postId: number, type: 'success' | 'error', text: string, autoHideMs = 3000) => {
    setPostMessages(prev => ({ ...prev, [postId]: { type, text } }));
    if (autoHideMs > 0) {
      window.setTimeout(() => {
        setPostMessages(prev => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }, autoHideMs);
    }
  };

  // Track deletion in progress to hide trash icon while deleting
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  // Track per-post reply composer visibility
  const [replyOpen, setReplyOpen] = useState<{ [postId: number]: boolean }>({});
  
  // Track editing state
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Function to close all reply inputs
  const closeAllReplyInputs = useCallback(() => {
    setReplyOpen({});
  }, []);

  // Function to start editing a post
  const startEditingPost = useCallback((postId: number, currentContent: string) => {
    setEditingPostId(postId);
    setEditingCommentId(null);
    setEditContent(currentContent);
  }, []);

  // Function to start editing a comment
  const startEditingComment = useCallback((commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingPostId(null);
    setEditContent(currentContent);
  }, []);

  // Function to cancel editing
  const cancelEditing = useCallback(() => {
    setEditingPostId(null);
    setEditingCommentId(null);
    setEditContent('');
  }, []);

  const handleReplyClick = (item: { id: number; author: User }) => {
    const authorHandle = getUserMentionHandle(item.author);
    const mentionPrefix = `@${authorHandle} `;
    setReplyOpen(prev => ({ ...prev, [item.id]: true }));
    setNewComment(prev => {
      const existing = prev[item.id] || '';
      // Ensure the content starts with the mention to the author
      const nextValue = existing.startsWith(mentionPrefix)
        ? existing
        : `${mentionPrefix}${existing.replace(/^@\w+\s+/, '')}`;
      return { ...prev, [item.id]: nextValue };
    });
  };

  // Load posts from API
  const loadPosts = useCallback(async () => {
    try {
      console.log('🔄 Loading posts for collaboration:', collaborationId, 'task:', taskId);
      setLoading(true);
      const url = `/api/collaborations/${collaborationId}/discussions?taskId=${taskId}`;
      console.log('🌐 Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('📡 API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 API response data:', data);
      
      if (data.success) {
        const newPosts = data.data || [];
        setPosts(newPosts);
        console.log('✅ Posts loaded successfully:', newPosts.length, 'posts');
      } else {
        console.error('❌ Failed to load posts:', data.message);
        addNotification('error', 'Failed to load posts: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      addNotification('error', 'Error loading posts: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [collaborationId, taskId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle click outside to close reply inputs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any reply input
      if (!target.closest('.reply-input-container')) {
        closeAllReplyInputs();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeAllReplyInputs]);

  // Listen for real-time updates
  useEffect(() => {
    const handleTaskStreamUpdate = (event: CustomEvent) => {
      const { taskId: eventTaskId, collaborationId: eventCollaborationId } = event.detail;
      if (eventTaskId === taskId && eventCollaborationId === collaborationId) {
        loadPosts();
      }
    };

    window.addEventListener('taskStreamUpdate', handleTaskStreamUpdate as EventListener);
    
    return () => {
      window.removeEventListener('taskStreamUpdate', handleTaskStreamUpdate as EventListener);
    };
  }, [taskId, collaborationId, loadPosts]);

  // Handle post creation
  const handleCreatePost = async (type: string, content: string, additionalData?: any) => {
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          type,
          content,
          ...additionalData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPosts(); // Reload posts
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
          detail: { taskId, collaborationId }
        }));
      } else {
        console.error('Failed to create post:', data.message);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  // Handle insight creation with mentions
  const handleCreateInsight = async (content: string, mentionedUsers: User[]) => {
    try {
      // Optimistically add the insight to the UI immediately
      const optimisticInsight = {
        id: Date.now(), // Temporary ID
        type: 'insight' as const,
        content,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar || ''
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      };
      
      setPosts(prevPosts => [optimisticInsight, ...prevPosts]);
      
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          type: 'insight',
          content,
          mentionedUsers: mentionedUsers.map(user => user.id)
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Insight created successfully, reloading posts...');
        // Reload posts to get the latest data with the real ID
        await loadPosts();
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
          detail: { taskId, collaborationId }
        }));
      } else {
        console.error('❌ Failed to create insight:', data.error || data.message);
        // Remove the optimistic update on failure
        setPosts(prevPosts => prevPosts.filter(post => post.id !== optimisticInsight.id));
        addNotification('error', 'Failed to create insight: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error creating insight:', error);
      // Remove the optimistic update on error
      setPosts(prevPosts => prevPosts.filter(post => post.id !== Date.now()));
      addNotification('error', 'Error creating insight: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle media upload with mentions
  const handleCreateMedia = async (content: string, files: File[], mentionedUsers: User[]) => {
    try {
      const uploadedFiles: string[] = [];
      const fileNames: string[] = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload file using FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId.toString());

        const fileResponse = await fetch(`/api/collaborations/${collaborationId}/files`, {
          method: 'POST',
          body: formData, // No Content-Type header needed for FormData
        });

        const fileResult = await fileResponse.json();
        
        if (!fileResult.success) {
          throw new Error(fileResult.error || `Failed to upload file: ${file.name}`);
        }

        uploadedFiles.push(fileResult.data.url);
        fileNames.push(file.name);
      }

      // Create a single post with all uploaded files
      const combinedContent = content || `Uploaded ${files.length} file${files.length !== 1 ? 's' : ''}`;
      
      // Create optimistic post for all files
      const optimisticMedia = {
        id: Date.now(), // Temporary ID
        type: 'media' as const,
        content: combinedContent,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar || ''
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        mediaUrl: uploadedFiles[0], // Use first file as primary media URL
        mediaUrls: uploadedFiles, // Store all URLs for multiple file display
        fileNames: fileNames // Store all filenames for display
      };
      
      setPosts(prevPosts => [optimisticMedia, ...prevPosts]);

      // Create a single discussion post for all files
      const discussionData = {
        taskId: taskId.toString(),
        type: 'media',
        content: combinedContent,
        mediaUrl: uploadedFiles[0], // Primary media URL
        mediaUrls: uploadedFiles, // All media URLs
        fileNames: fileNames, // All file names
        mentionedUsers: mentionedUsers.map(user => user.id)
      };

      const response = await fetch(`/api/collaborations/${collaborationId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discussionData),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Media files uploaded successfully, reloading posts...');
        // Reload posts to get the latest data with the real ID
        await loadPosts();
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
          detail: { taskId, collaborationId }
        }));
        addNotification('success', `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully!`);
      } else {
        console.error('❌ Failed to create media discussion:', data.error || data.message);
        // Remove the optimistic update on failure
        setPosts(prevPosts => prevPosts.filter(post => post.id !== optimisticMedia.id));
        addNotification('error', 'Failed to create media discussion: ' + (data.error || data.message || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('❌ Error uploading media:', error);
      // Remove the optimistic update on error
      setPosts(prevPosts => prevPosts.filter(post => post.id !== Date.now()));
      addNotification('error', 'Error uploading media: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (targetId: number) => {
    const commentContent = newComment[targetId];
    if (!commentContent?.trim()) return;

    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions/${targetId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentContent
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewComment(prev => ({ ...prev, [targetId]: '' }));
        setReplyOpen(prev => ({ ...prev, [targetId]: false })); // Close the reply input
        await loadPosts(); // Reload posts
      } else {
        console.error('Failed to create comment:', data.message);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  // (Like action removed)

  // Handle file download
  const handleDownloadFile = async (url: string, filename?: string) => {
    try {
      // If the URL is a relative path (starts with /), it's a local file
      if (url.startsWith('/')) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'file';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For external URLs, fetch the file first to ensure it's accessible
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      addNotification('error', 'Failed to download file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle download all files as ZIP
  const handleDownloadAll = async (urls: string[], filenames?: string[]) => {
    try {
      addNotification('success', 'Creating ZIP archive...');
      
      const zip = new JSZip();
      
      // Fetch all files and add them to the ZIP
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const filename = filenames?.[i] || getFilename(url) || `file_${i + 1}`;
        
        try {
          // Fetch the file
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Add file to ZIP
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Error fetching file ${filename}:`, error);
          // Continue with other files even if one fails
        }
      }
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `media_files_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      
      addNotification('success', 'ZIP file downloaded successfully!');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      addNotification('error', 'Failed to create ZIP file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: number) => {
    const target = posts.find(p => p.id === postId);
    if (!target) return;
    // Hide inline controls immediately after user confirms delete
    setPendingDeleteId(null);

    // Keep page position; show inline success first, then remove after a delay
    const previousPosts = posts;
    setInlinePostMessage(postId, 'success', 'Deleting...');

    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to delete');
      }
      // Notify others
      window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
        detail: { taskId, collaborationId }
      }));
      setInlinePostMessage(postId, 'success', 'Post deleted');
      // Remove the post shortly after showing success so layout doesn't jump immediately
      window.setTimeout(() => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (deletingPostId === postId) setDeletingPostId(null);
      }, 500);
    } catch (error) {
      console.error('Error deleting post:', error);
      // Keep list as-is and show inline error
      setPosts(previousPosts);
      setInlinePostMessage(postId, 'error', 'Failed to delete post.');
      if (deletingPostId === postId) setDeletingPostId(null);
    }
    setPendingDeleteId(null);
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: number, postId: number) => {
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        // Remove comment from UI
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
              : post
          )
        );
        addNotification('success', 'Comment deleted successfully');
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
          detail: { taskId, collaborationId }
        }));
      } else {
        throw new Error(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      addNotification('error', 'Failed to delete comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle edit comment
  const handleEditComment = async (commentId: number, newContent: string, postId: number) => {
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      });
      const data = await response.json();
      
      if (data.success) {
        // Update comment in UI
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  comments: post.comments.map(c => 
                    c.id === commentId 
                      ? { ...c, content: newContent, updatedAt: new Date().toISOString() }
                      : c
                  )
                }
              : post
          )
        );
        addNotification('success', 'Comment updated successfully');
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
          detail: { taskId, collaborationId }
        }));
      } else {
        throw new Error(data.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      addNotification('error', 'Failed to update comment: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      addNotification('error', 'Content cannot be empty');
      return;
    }

    try {
      if (editingPostId) {
        await handleEditComment(editingPostId, editContent.trim(), editingPostId);
        cancelEditing();
      } else if (editingCommentId) {
        // Find the post that contains this comment
        const postWithComment = posts.find(post => 
          post.comments.some(comment => comment.id === editingCommentId)
        );
        if (postWithComment) {
          await handleEditComment(editingCommentId, editContent.trim(), postWithComment.id);
          cancelEditing();
        }
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      addNotification('error', 'Failed to save changes');
    }
  };

  // Filter posts based on current filters
  const filteredPosts = posts.filter(post => {
    if (filter !== 'all' && post.type !== filter) return false;
    if (memberFilter !== 'all' && post.author.id.toString() !== memberFilter) return false;
    // Add time filtering logic here
    return true;
  });

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get user initials
  const getUserInitials = (user: User) => {
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get type-specific styling
  const getTypeStyling = (type: string) => {
    const styles = {
      insight: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      },
      media: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      link: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )
      },
      subtask: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      }
    };
    return styles[type as keyof typeof styles] || styles.insight;
  };

  // Helper functions for media type detection
  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'psd', 'tiff', 'tif', 'raw', 'heic', 'heif'];
    return imageExtensions.includes(getFileExtension(url));
  };

  const isVideoFile = (url: string) => {
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', '3gp', 'ogv', 'mpg', 'mpeg', 'm2v'];
    return videoExtensions.includes(getFileExtension(url));
  };

  const isAudioFile = (url: string) => {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus', 'aiff', 'au', 'ra', 'ram'];
    return audioExtensions.includes(getFileExtension(url));
  };

  const isPdfFile = (url: string) => {
    return getFileExtension(url) === 'pdf';
  };

  const isCodeFile = (url: string) => {
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'scss', 'json', 'xml', 'sql', 'php', 'rb', 'go', 'rs', 'cpp', 'c', 'java', 'swift', 'kt', 'dart', 'vue', 'svelte', 'r', 'scala', 'clj', 'hs', 'ml', 'fs', 'vb', 'cs', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'];
    return codeExtensions.includes(getFileExtension(url));
  };

  const isDocumentFile = (url: string) => {
    const docExtensions = ['doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'xls', 'xlsx', 'ppt', 'pptx', 'key', 'numbers', 'csv', 'tsv', 'md', 'rst', 'tex', 'latex'];
    return docExtensions.includes(getFileExtension(url));
  };

  const getFilename = (url: string): string => {
    return url.split('/').pop() || 'Media File';
  };

  const getFileIcon = (url: string) => {
    const extension = getFileExtension(url);
    
    // Special cases for specific file types
    if (extension === 'psd') return '🎨';
    if (extension === 'ai') return '🎨';
    if (extension === 'sketch') return '🎨';
    if (extension === 'figma') return '🎨';
    if (extension === 'xd') return '🎨';
    if (extension === 'zip') return '📦';
    if (extension === 'rar') return '📦';
    if (extension === '7z') return '📦';
    if (extension === 'tar') return '📦';
    if (extension === 'gz') return '📦';
    if (extension === 'exe') return '⚙️';
    if (extension === 'dmg') return '💿';
    if (extension === 'iso') return '💿';
    
    // General categories
    if (isImageFile(url)) return '🖼️';
    if (isVideoFile(url)) return '🎥';
    if (isAudioFile(url)) return '🎵';
    if (isPdfFile(url)) return '📄';
    if (isCodeFile(url)) return '💻';
    if (isDocumentFile(url)) return '📝';
    
    return '📎';
  };

  const getFileIconSvg = (url: string) => {
    const extension = getFileExtension(url);
    
    // Special cases for specific file types
    if (extension === 'psd' || extension === 'ai' || extension === 'sketch' || extension === 'figma' || extension === 'xd') {
      return (
        <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.57489 2.07403C5.83474 2.19892 6 2.4617 6 2.75001C6 3.57985 6.31211 4.05763 6.70313 4.63948L6.73156 4.68175C7.0641 5.17579 7.5 5.8234 7.5 6.75001C7.5 7.69552 7.02282 8.52959 6.29615 9.02452C6.48733 9.1848 6.65672 9.38248 6.80225 9.61803C7.27801 10.388 7.5 11.5645 7.5 13.2549C7.5 14.967 7.27003 17.023 6.89541 18.6644C6.70914 19.4806 6.47843 20.2335 6.20272 20.7994C6.06598 21.08 5.89948 21.3541 5.69217 21.5685C5.48714 21.7804 5.17035 22.0049 4.75 22.0049C4.32965 22.0049 4.01286 21.7804 3.80783 21.5685C3.60052 21.3541 3.43402 21.08 3.29728 20.7994C3.02157 20.2335 2.79086 19.4806 2.60459 18.6644C2.22997 17.023 2 14.967 2 13.2549C2 11.5645 2.22199 10.388 2.69775 9.61803C2.84328 9.38248 3.01267 9.1848 3.20385 9.02452C2.47718 8.52959 2 7.69552 2 6.75001C2 6.38181 2.00034 5.74889 2.38341 4.93168C2.75829 4.13192 3.47066 3.21301 4.78148 2.16436C5.00661 1.98425 5.31504 1.94914 5.57489 2.07403Z" fill="currentColor" />
          <path d="M9.99994 14.917C9.46162 14.8267 8.94761 14.6647 8.46806 14.4412C8.48904 14.0349 8.49994 13.637 8.49994 13.2549C8.49994 12.8491 8.48793 12.461 8.46151 12.0915C8.90465 12.4558 9.4275 12.7266 9.99994 12.874V10.5C9.99994 9.67157 10.6715 9 11.4999 9H14.9999C14.9999 6.79086 13.2091 5 10.9999 5C10.0146 5 9.11251 5.35626 8.4154 5.94699C8.24173 5.13337 7.83957 4.53662 7.58275 4.15554L7.54248 4.09572C8.51976 3.40549 9.7125 3 10.9999 3C14.3136 3 16.9999 5.68629 16.9999 9H20.4999C21.3284 9 21.9999 9.67157 21.9999 10.5V19.5C21.9999 20.3284 21.3284 21 20.4999 21H11.4999C10.6715 21 9.99994 20.3284 9.99994 19.5V14.917ZM11.9999 14.917V19H19.9999V11H16.6585C15.9423 13.0265 14.1683 14.5533 11.9999 14.917ZM14.4648 11H11.9999V12.874C13.0508 12.6035 13.9345 11.9168 14.4648 11Z" fill="currentColor" />
        </svg>
      );
    }
    
    if (extension === 'zip' || extension === 'rar' || extension === '7z' || extension === 'tar' || extension === 'gz') {
      return (
        <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 20V4C2 3.44772 2.44772 3 3 3H8.44792C8.79153 3 9.11108 3.17641 9.29416 3.46719L10.5947 5.53281C10.7778 5.82359 11.0974 6 11.441 6H21C21.5523 6 22 6.44772 22 7V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20Z" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="7" width="2" height="2" fill="currentColor" />
          <rect x="16" y="9" width="2" height="2" fill="currentColor" />
          <rect x="14" y="11" width="2" height="2" fill="currentColor" />
          <rect x="16" y="13" width="2" height="2" fill="currentColor" />
          <rect x="14" y="15" width="2" height="2" fill="currentColor" />
          <rect x="16" y="17" width="2" height="2" fill="currentColor" />
          <rect x="14" y="17" width="2" height="2" fill="currentColor" />
        </svg>
      );
    }
    
    if (extension === 'exe') {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve">
          <path d="M438.187,101.427L339.872,3.124c-2-2-4.712-3.124-7.541-3.124H103.978C85.622,0,70.687,14.934,70.687,33.291v445.419 c0,18.356,14.934,33.291,33.292,33.291h304.042c18.357,0,33.292-14.934,33.292-33.291V108.97 C441.311,106.141,440.188,103.427,438.187,101.427z M404.893,98.305l-0.002-0.002h-61.893V36.417l-0.003-0.004L404.893,98.305z M419.978,478.709c0,6.594-5.364,11.957-11.957,11.957H103.978c-6.594,0-11.958-5.363-11.958-11.957V33.291 c0.001-6.594,5.365-11.957,11.958-11.957h217.685v87.636c0,5.89,4.777,10.667,10.667,10.667h87.648V478.709z" />
          <path d="M308.683,161.287c-3.828,4.477-3.302,11.211,1.177,15.039l53.481,45.723l-53.481,45.723 c-4.478,3.828-5.004,10.561-1.177,15.039c2.11,2.467,5.101,3.736,8.112,3.736c2.452,0,4.916-0.841,6.926-2.559l62.963-53.83 c2.371-2.026,3.735-4.989,3.735-8.108c0-3.119-1.364-6.081-3.734-8.108l-62.963-53.83 C319.246,156.282,312.51,156.809,308.683,161.287z" />
          <path d="M195.204,286.546c3.01,0,6.003-1.267,8.112-3.735c3.828-4.477,3.302-11.211-1.177-15.039l-53.481-45.723l53.481-45.723 c4.478-3.828,5.004-10.561,1.177-15.039c-3.827-4.478-10.562-5.006-15.039-1.177l-62.963,53.83 c-2.371,2.026-3.735,4.989-3.735,8.108c0,3.119,1.364,6.081,3.735,8.108l62.963,53.83 C190.287,285.706,192.751,286.546,195.204,286.546z" />
          <path d="M229.031,304.897c1.096,0.357,2.21,0.527,3.305,0.527c4.494,0,8.674-2.864,10.141-7.367l47.333-145.409 c1.824-5.602-1.239-11.622-6.841-13.444c-5.602-1.825-11.622,1.239-13.444,6.841l-47.333,145.409 C220.366,297.054,223.43,303.074,229.031,304.897z" />
          <path d="M306.198,346.416c0-5.89-4.777-10.667-10.667-10.667H187.733c-5.89,0-10.667,4.776-10.667,10.667 s4.777,10.667,10.667,10.667h107.798C301.421,357.083,306.198,352.306,306.198,346.416z" />
          <path d="M146.933,335.749H145.6c-5.89,0-10.667,4.776-10.667,10.667s4.777,10.667,10.667,10.667h1.333 c5.89,0,10.667-4.777,10.667-10.667S152.823,335.749,146.933,335.749z" />
          <path d="M366.399,383.749H207.466c-5.89,0-10.667,4.776-10.667,10.667s4.777,10.667,10.667,10.667h158.933 c5.89,0,10.667-4.777,10.667-10.667S372.29,383.749,366.399,383.749z" />
          <path d="M302.399,431.749h-94.933c-5.89,0-10.667,4.776-10.667,10.667s4.777,10.667,10.667,10.667h94.933 c5.89,0,10.667-4.777,10.667-10.667S308.29,431.749,302.399,431.749z" />
        </svg>
      );
    }
    
    if (extension === 'dmg' || extension === 'iso') {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 64 64" data-name="Material Expand" id="Material_Expand" xmlns="http://www.w3.org/2000/svg">
          <path d="M54,2H10A2,2,0,0,0,8,4V60a2,2,0,0,0,2,2H54a2,2,0,0,0,2-2V4A2,2,0,0,0,54,2ZM52,14H36V6H52ZM16,6v4h4V6h4v4h4V6h4v8H12V6ZM12,58V26h4V22H12V18H52v4H48v4h4V50H48v4h4v4Z" />
          <path d="M32,22A15.973,15.973,0,0,0,19.377,47.8l-3.791,3.791,2.828,2.828,3.791-3.791A15.991,15.991,0,1,0,32,22Zm0,28a11.922,11.922,0,0,1-6.942-2.23l3.356-3.356-2.828-2.828L22.23,44.942A11.988,11.988,0,1,1,32,50Z" />
          <rect height="4" width="4" x="30" y="36" />
        </svg>
      );
    }
    
    // General categories
    if (isImageFile(url)) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (isVideoFile(url)) {
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (isAudioFile(url)) {
      return (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    
    if (isPdfFile(url)) {
      return (
        <svg className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4C4 3.44772 4.44772 3 5 3H14H14.5858C14.851 3 15.1054 3.10536 15.2929 3.29289L19.7071 7.70711C19.8946 7.89464 20 8.149 20 8.41421V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 8H15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.5 13H11V17H11.5C12.6046 17 13.5 16.1046 13.5 15C13.5 13.8954 12.6046 13 11.5 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5 17V13L17.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 17L7 15.5M7 15.5L7 13L7.75 13C8.44036 13 9 13.5596 9 14.25V14.25C9 14.9404 8.44036 15.5 7.75 15.5H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    
    if (isCodeFile(url)) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    
    if (isDocumentFile(url)) {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    // Generic file icon
    return (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getFileTypeLabel = (url: string) => {
    const extension = getFileExtension(url);
    
    // Special cases for specific file types
    if (extension === 'psd') return 'Photoshop file';
    if (extension === 'ai') return 'Illustrator file';
    if (extension === 'sketch') return 'Sketch file';
    if (extension === 'figma') return 'Figma file';
    if (extension === 'xd') return 'Adobe XD file';
    if (extension === 'zip') return 'ZIP archive';
    if (extension === 'rar') return 'RAR archive';
    if (extension === '7z') return '7-Zip archive';
    if (extension === 'tar') return 'TAR archive';
    if (extension === 'gz') return 'GZIP archive';
    if (extension === 'exe') return 'Executable file';
    if (extension === 'dmg') return 'Disk image';
    if (extension === 'iso') return 'ISO image';
    
    // General categories
    if (isImageFile(url)) return 'Image file';
    if (isVideoFile(url)) return 'Video file';
    if (isAudioFile(url)) return 'Audio file';
    if (isPdfFile(url)) return 'PDF document';
    if (isCodeFile(url)) return 'Code file';
    if (isDocumentFile(url)) return 'Document';
    
    return 'File';
  };

  // Compute the standard mention handle for a user (matches composer behavior)
  const getUserMentionHandle = (user: User): string => {
    const nameParts = user.name.split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      return `${firstName}${lastName.charAt(0)}`;
    }
    return user.name;
  };

  // Render text with @mentions; highlight mentions that target the current viewer
  const [prefillContent, setPrefillContent] = useState<string | undefined>(undefined);
  const [prefillMentionedUsers, setPrefillMentionedUsers] = useState<User[] | undefined>(undefined);

  const handleMentionClick = (handle: string) => {
    const target = teamMembers.find(u => getUserMentionHandle(u).toLowerCase() === handle.toLowerCase());
    if (!target) return;
    if (target.id === currentUser.id) return; // ignore clicks on self mentions
    const contentSeed = `@${getUserMentionHandle(target)} `;
    setPrefillContent(contentSeed);
    setPrefillMentionedUsers([target]);
    setShowAddInsightModal(true);
  };

  const renderContentWithMentions = (text: string): React.ReactNode => {
    const viewerHandle = getUserMentionHandle(currentUser);
    const parts: React.ReactNode[] = [];
    const mentionRegex = /@([A-Za-z0-9_]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      if (matchStart > lastIndex) {
        parts.push(text.slice(lastIndex, matchStart));
      }
      const handle = match[1];
      const isViewer = handle.toLowerCase() === viewerHandle.toLowerCase();
      parts.push(
        isViewer ? (
          <span key={`m-${matchStart}`} className="font-bold text-red-600">@{handle}</span>
        ) : (
          <button
            key={`m-${matchStart}`}
            type="button"
            onClick={() => handleMentionClick(handle)}
            className="font-semibold text-gray-800"
            title={`Mention ${handle}`}
          >
            @{handle}
          </button>
        )
      );
      lastIndex = matchEnd;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification banners (in-DOM) */}
      {/* NOTE: Search for "Notification banners (in-DOM)" to find this system quickly. */}
      <div
        role="status"
        aria-live="polite"
        className="space-y-2"
      >
        {notifications.map(n => (
          <div
            key={n.id}
            className={`flex items-start justify-between rounded-md px-4 py-2 border ${n.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}
          >
            <span className="text-sm">{n.text}</span>
            <button
              onClick={() => dismissNotification(n.id)}
              className="ml-4 text-xs opacity-70 hover:opacity-100"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Moved per-post deletion confirmation inline under each post */}
      {/* Post Creation Area */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowAddInsightModal(true)}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors border border-blue-200"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2.75C8.27208 2.75 5.25 5.77208 5.25 9.5C5.25 11.4985 6.11758 13.2934 7.49907 14.5304L7.50342 14.5343C8.06008 15.0328 8.48295 15.4114 8.78527 15.6886C9.06989 15.9495 9.29537 16.1628 9.41353 16.3086L9.42636 16.3244C9.64763 16.5974 9.84045 16.8353 9.9676 17.1199C10.0948 17.4044 10.1434 17.7067 10.1992 18.0537L10.2024 18.0738C10.231 18.2517 10.2425 18.4701 10.247 18.75H13.753C13.7575 18.4701 13.769 18.2517 13.7976 18.0738L13.8008 18.0537C13.8566 17.7067 13.9052 17.4044 14.0324 17.1199C14.1596 16.8353 14.3524 16.5974 14.5736 16.3244L14.5865 16.3086C14.7046 16.1628 14.9301 15.9495 15.2147 15.6886C15.5171 15.4114 15.94 15.0327 16.4966 14.5343L16.5009 14.5304C17.8824 13.2934 18.75 11.4985 18.75 9.5C18.75 5.77208 15.7279 2.75 12 2.75ZM13.7436 20.25H10.2564C10.2597 20.3542 10.2646 20.4453 10.2721 20.5273C10.2925 20.7524 10.3269 20.8341 10.3505 20.875C10.4163 20.989 10.511 21.0837 10.625 21.1495C10.6659 21.1731 10.7476 21.2075 10.9727 21.2279C11.2082 21.2493 11.5189 21.25 12 21.25C12.4811 21.25 12.7918 21.2493 13.0273 21.2279C13.2524 21.2075 13.3341 21.1731 13.375 21.1495C13.489 21.0837 13.5837 20.989 13.6495 20.875C13.6731 20.8341 13.7075 20.7524 13.7279 20.5273C13.7354 20.4453 13.7403 20.3542 13.7436 20.25ZM3.75 9.5C3.75 4.94365 7.44365 1.25 12 1.25C16.5563 1.25 20.25 4.94365 20.25 9.5C20.25 11.9428 19.1874 14.1384 17.5016 15.6479C16.9397 16.151 16.5234 16.5238 16.2284 16.7942C16.0809 16.9295 15.9681 17.0351 15.8849 17.1162C15.8434 17.1566 15.8117 17.1886 15.788 17.2134C15.7763 17.2256 15.7675 17.2352 15.7611 17.2423C15.7546 17.2496 15.7519 17.2529 15.7519 17.2529C15.4917 17.574 15.4354 17.6568 15.4019 17.7319C15.3683 17.8069 15.3442 17.9041 15.2786 18.3121C15.2527 18.4732 15.25 18.7491 15.25 19.5V19.5322C15.25 19.972 15.25 20.3514 15.2218 20.6627C15.192 20.9918 15.1259 21.3178 14.9486 21.625C14.7511 21.967 14.467 22.2511 14.125 22.4486C13.8178 22.6259 13.4918 22.692 13.1627 22.7218C12.8514 22.75 12.472 22.75 12.0322 22.75H11.9678C11.528 22.75 11.1486 22.75 10.8374 22.7218C10.5082 22.692 10.1822 22.6259 9.875 22.4486C9.53296 22.2511 9.24892 21.967 9.05144 21.625C8.87407 21.3178 8.80802 20.9918 8.77818 20.6627C8.74997 20.3514 8.74998 19.972 8.75 19.5322L8.75 19.5C8.75 18.7491 8.74735 18.4732 8.72144 18.3121C8.6558 17.9041 8.63166 17.8069 8.59812 17.7319C8.56459 17.6568 8.50828 17.574 8.24812 17.2529C8.24812 17.2529 8.24514 17.2493 8.23888 17.2423C8.23249 17.2352 8.22369 17.2256 8.21199 17.2134C8.18835 17.1886 8.15661 17.1566 8.11513 17.1162C8.03189 17.0351 7.91912 16.9295 7.77161 16.7942C7.4766 16.5238 7.06034 16.151 6.49845 15.6479C4.81263 14.1384 3.75 11.9428 3.75 9.5Z" fill="currentColor"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M13.2215 7.8897C13.5586 8.13046 13.6366 8.59887 13.3959 8.93593L12.1001 10.75H13.6427C13.9237 10.75 14.181 10.907 14.3096 11.1568C14.4382 11.4066 14.4163 11.7073 14.253 11.9359L12.1102 14.9359C11.8694 15.273 11.401 15.3511 11.0639 15.1103C10.7269 14.8695 10.6488 14.4011 10.8896 14.0641L12.1853 12.25H10.6427C10.3618 12.25 10.1044 12.093 9.97585 11.8432C9.84729 11.5934 9.86913 11.2927 10.0324 11.0641L12.1753 8.06407C12.416 7.72701 12.8844 7.64894 13.2215 7.8897Z" fill="currentColor"></path>
              </g>
            </svg>
            <span className="font-semibold">Add Insight</span>
          </button>
          
          <button 
            onClick={() => setShowAddMediaModal(true)}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors border border-red-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-semibold">Upload Media</span>
          </button>
          
          <button 
            onClick={() => handleCreatePost('link', 'Sharing link...')}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-xl transition-colors border border-yellow-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <span className="font-semibold">Drop Link</span>
          </button>
          
          <button 
            onClick={() => handleCreatePost('subtask', 'Creating subtask...')}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors border border-green-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <span className="font-semibold">Create Subtask</span>
          </button>
        </div>
      </div>

      {/* Stream Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No posts yet</div>
            <p className="text-sm text-gray-400">Be the first to share an insight, upload media, or create a subtask!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const typeStyle = getTypeStyling(post.type);
            
            return (
              <div key={post.id} className={`bg-white rounded-xl border border-gray-200 p-4 pt-4 relative ${post.author.id === currentUser.id && post.comments && post.comments.length > 0 ? 'pb-12' : ''}`}>
                <div className="flex items-start space-x-3">
                  
                  <div className="flex-1">
                    <div className="flex items-start space-x-2 mb-2 justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-10 h-10 ${typeStyle.bg} rounded-full flex items-center justify-center text-sm font-medium ${typeStyle.text} flex-shrink-0`}>
                          {getUserInitials(post.author)}
                        </div>
                        <span className="font-medium text-gray-900">{post.author.name}</span>
                        <span className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.icon} {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Only show content if it's not the default "Uploaded X file(s)" text for media posts */}
                    {!(post.type === 'media' && post.content.match(/^Uploaded \d+ file/)) && (
                      editingPostId === post.id ? (
                        // Edit mode for post
                        <div className="mb-6 mt-6">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Edit your post..."
                          />
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 mb-6 mt-6 text-lg ">{renderContentWithMentions(post.content)}</p>
                      )
                    )}
                    
                    {/* Media Files List */}
                    {post.mediaUrl && (
                      <div className={`mb-3 ${!(post.type === 'media' && post.content.match(/^Uploaded \d+ file/)) && post.content && post.content.trim() ? '' : 'mt-4'}`}>
                        {/* Multiple Files */}
                        {post.mediaUrls && post.mediaUrls.length > 1 && (
                          <div className="bg-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clipPath="url(#clip0_901_1141)">
                                      <path d="M12 13H15M12 16H20M12 20H20M12 24H20M21 7V2C21 1.447 20.553 1 20 1H2C1.447 1 1 1.447 1 2V24C1 24 1 25 2 25H3M26 27H30C30.553 27 31 26.553 31 26V4C31 3.447 30.553 3 30 3H24M26 30C26 30.553 25.553 31 25 31H7C6.447 31 6 30.553 6 30V8C6 7.447 6.447 7 7 7H25C25.553 7 26 7.447 26 8V30Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </g>
                                    <defs>
                                      <clipPath id="clip0_901_1141">
                                        <rect width="32" height="32" fill="white" />
                                      </clipPath>
                                    </defs>
                                  </svg>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{post.mediaUrls.length} files uploaded</div>
                                  <div className="text-sm text-gray-500">Multiple media files</div>
                                </div>
                              </div>
                              <button
                                onClick={() => post.mediaUrls && handleDownloadAll(post.mediaUrls, post.fileNames || [])}
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                  <g id="SVGRepo_iconCarrier">
                                    <title>cloud-download-solid</title>
                                    <g id="Layer_2" data-name="Layer 2">
                                      <g id="invisible_box" data-name="invisible box">
                                        <rect width="48" height="48" fill="none"></rect>
                                      </g>
                                      <g id="icons_Q2" data-name="icons Q2">
                                        <path d="M40.5,21.8a9.1,9.1,0,0,0-3.4-6.5A9.8,9.8,0,0,0,29.6,13,12.5,12.5,0,0,0,19.5,7a11.6,11.6,0,0,0-8.9,4,12.4,12.4,0,0,0-3.2,8.4,11.8,11.8,0,0,0-5.2,8.2A11.5,11.5,0,0,0,5.3,37.8,12.4,12.4,0,0,0,14,41H34.5c7.7,0,11.3-5.1,11.5-9.9A10,10,0,0,0,40.5,21.8Zm-8.2,8.7-6.9,6.9a1.9,1.9,0,0,1-2.8,0l-6.9-6.9a2.2,2.2,0,0,1-.4-2.7,2,2,0,0,1,3.1-.2L22,31.2V20a2,2,0,0,1,4,0V31.2l3.6-3.6a2,2,0,0,1,3.1.2A2.2,2.2,0,0,1,32.3,30.5Z"></path>
                                      </g>
                                    </g>
                                  </g>
                                </svg>
                                <span>Download all as ZIP</span>
                              </button>
                            </div>
                            <div className="space-y-2">
                              {post.mediaUrls.map((url: string, index: number) => (
                                <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
                                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                    {getFileIconSvg(url)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {post.fileNames?.[index] || getFilename(url)}
                                    </div>
                                    <div className="text-xs text-gray-500">{getFileTypeLabel(url)}</div>
                                  </div>
                                  <button
                                    onClick={() => handleDownloadFile(url, post.fileNames?.[index] || getFilename(url) || 'file')}
                                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Download</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Single File */}
                        {(!post.mediaUrls || post.mediaUrls.length === 1) && (
                          <div className="bg-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                                  {getFileIconSvg(post.mediaUrl)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{getFilename(post.mediaUrl)}</div>
                                  <div className="text-sm text-gray-500">{getFileTypeLabel(post.mediaUrl)}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => post.mediaUrl && handleDownloadFile(post.mediaUrl, getFilename(post.mediaUrl) || 'file')}
                                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Link Preview */}
                    {post.linkPreview && (
                      <div className="border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{post.linkPreview.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{post.linkPreview.description}</p>
                            <span className="text-xs text-gray-500">{new URL(post.linkPreview.url).hostname}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Subtask Preview */}
                    {post.subtask && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-gray-300 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span className="font-medium text-gray-900">{post.subtask.title}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {post.subtask.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{post.subtask.description}</p>
                      </div>
                    )}
                    
                    {/* Post Actions */}
                    {editingPostId !== post.id && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {post.author.id === currentUser.id ? (
                          // User's own post - show Edit button only if there's meaningful content
                          post.content && 
                          post.content.trim() && 
                          !(post.type === 'media' && post.content.match(/^Uploaded \d+ file/)) && (
                            <button
                              onClick={() => startEditingPost(post.id, post.content)}
                              className="hover:underline transition-all text-gray-600"
                            >
                              Edit
                            </button>
                          )
                        ) : (
                          // Other user's post - show Reply button
                          !replyOpen[post.id] && (
                            <button
                              onClick={() => handleReplyClick(post)}
                              className="flex items-center space-x-1 hover:underline transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                              </svg>
                              <span>Reply</span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Reply input for top-level posts */}
                    {replyOpen[post.id] && (
                      <div className="mt-4 reply-input-container">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                            {getUserInitials(currentUser)}
                          </div>
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <button
                              onClick={() => handleSubmitComment(post.id)}
                              className="px-3 py-2 text-sm rounded bg-gray-600 text-white hover:bg-gray-700"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Inline post messages (per-post) */}
                    {postMessages[post.id] && (
                      <div className={`mt-3 rounded-md px-3 py-2 text-sm border ${postMessages[post.id]?.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
                        {postMessages[post.id]?.text}
                      </div>
                    )}

                    {/* Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {post.comments
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((comment) => (
                          <div key={comment.id} className="relative flex items-start space-x-3">
                            {/* <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 mt-0.5">
                              {getUserInitials(comment.author)}
                            </div> */}
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{comment.author.name}</span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                              </div>
                              {editingCommentId === comment.id ? (
                                // Edit mode for comment
                                <div className="mb-2">
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Edit your comment..."
                                  />
                                  <div className="flex items-center space-x-2 mt-1">
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-700 text-sm">{renderContentWithMentions(comment.content)}</p>
                              )}
                              {/* Comment actions: Reply for others, Edit/Delete for own comments */}
                              {editingCommentId !== comment.id && (
                                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                                  {comment.author.id === currentUser.id ? (
                                    // User's own comment - show Edit and Delete buttons
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => startEditingComment(comment.id, comment.content)}
                                        className="hover:underline transition-all text-gray-600"
                                      >
                                        Edit
                                      </button>
                                      <span className="text-gray-300">|</span>
                                      <button
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this comment?')) {
                                            handleDeleteComment(comment.id, post.id);
                                          }
                                        }}
                                        className="hover:underline transition-all text-gray-600"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : (
                                    // Other user's comment - show Reply button
                                    !replyOpen[comment.id] && (
                                      <button
                                        onClick={() => handleReplyClick({ id: comment.id, author: comment.author })}
                                        className="hover:underline transition-all"
                                      >
                                        Reply
                                      </button>
                                    )
                                  )}
                                </div>
                              )}

                              {/* Comment Input (visible only when Reply opened for this comment) */}
                              {replyOpen[comment.id] && (
                                <div className="mt-2 reply-input-container">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                                      {getUserInitials(currentUser)}
                                    </div>
                                    <div className="flex-1 flex items-center space-x-2">
                                      <input 
                                        type="text" 
                                        placeholder="Write a reply..." 
                                        value={newComment[comment.id] || ''}
                                        onChange={(e) => setNewComment(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(comment.id)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                      />
                                      <button
                                        onClick={() => handleSubmitComment(comment.id)}
                                        className="px-3 py-2 text-sm rounded bg-gray-600 text-white hover:bg-gray-700"
                                      >
                                        Post
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Child replies (second level only) */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3 space-y-3">
                                  {comment.replies
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .map((child) => (
                                    <div key={child.id} className="flex items-start space-x-3">
                                      {/* <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600 flex-shrink-0 mt-0.5">
                                        {getUserInitials(child.author)}
                                      </div> */}
                                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="font-medium text-gray-900 text-sm">{child.author.name}</span>
                                          <span className="text-xs text-gray-500">{formatTimeAgo(child.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{renderContentWithMentions(child.content)}</p>
                                        {/* No Reply button for second-level to avoid deeper nesting */}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {post.author.id === currentUser.id && !replyOpen[post.id] && (
                  <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                    {pendingDeleteId === post.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={cancelDeletePost}
                          className="px-2 py-0.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setDeletingPostId(post.id);
                            handleDeletePost(post.id);
                          }}
                          className="px-2 py-0.5 text-xs rounded border border-red-600 bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      deletingPostId !== post.id ? (
                      <button
                        type="button"
                        aria-label="Delete post"
                        title="Delete post"
                        onClick={() => requestDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Insight Modal */}
      <AddInsightModal
        isOpen={showAddInsightModal}
        onClose={() => setShowAddInsightModal(false)}
        onSubmit={handleCreateInsight}
        teamMembers={teamMembers}
        currentUser={currentUser}
        initialContent={prefillContent}
        initialMentionedUsers={prefillMentionedUsers}
      />

      {/* Add Media Modal */}
      <AddMediaModal
        isOpen={showAddMediaModal}
        onClose={() => setShowAddMediaModal(false)}
        onSubmit={handleCreateMedia}
        teamMembers={teamMembers}
        currentUser={currentUser}
      />
    </div>
  );
};

export default TaskStream;
