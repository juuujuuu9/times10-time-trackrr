import React, { useState, useEffect, useCallback } from 'react';
import AddInsightModal from './AddInsightModal';

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

  // Load posts from API
  const loadPosts = useCallback(async () => {
    try {
      console.log('Loading posts for collaboration:', collaborationId, 'task:', taskId);
      setLoading(true);
      const url = `/api/collaborations/${collaborationId}/discussions?taskId=${taskId}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('API response status:', response.status);
      
      const data = await response.json();
      console.log('API response data:', data);
      
      if (data.success) {
        setPosts(data.data || []);
        console.log('Posts loaded:', data.data?.length || 0);
      } else {
        console.error('Failed to load posts:', data.message);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }, [collaborationId, taskId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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
        await loadPosts(); // Reload posts
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('taskStreamUpdate', {
          detail: { taskId, collaborationId }
        }));
      } else {
        console.error('Failed to create insight:', data.message);
      }
    } catch (error) {
      console.error('Error creating insight:', error);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (postId: number) => {
    const commentContent = newComment[postId];
    if (!commentContent?.trim()) return;

    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions/${postId}/comments`, {
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
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        await loadPosts(); // Reload posts
      } else {
        console.error('Failed to create comment:', data.message);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  // Handle like
  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/collaborations/${collaborationId}/discussions/${postId}/like`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPosts(); // Reload posts
      } else {
        console.error('Failed to like post:', data.message);
      }
    } catch (error) {
      console.error('Error liking post:', error);
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
      insight: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💡' },
      media: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '📎' },
      link: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🔗' },
      subtask: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' }
    };
    return styles[type as keyof typeof styles] || styles.insight;
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
            onClick={() => handleCreatePost('media', 'Uploading media...')}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors border border-purple-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-semibold">Add Media</span>
          </button>
          
          <button 
            onClick={() => handleCreatePost('link', 'Sharing link...')}
            className="flex items-center justify-center space-x-3 px-6 py-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-colors border border-orange-200"
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
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${typeStyle.bg} rounded-full flex items-center justify-center text-sm font-medium ${typeStyle.text} flex-shrink-0`}>
                    {getUserInitials(post.author)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{post.author.name}</span>
                      <span className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.icon} {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{post.content}</p>
                    
                    {/* Media Preview */}
                    {post.mediaUrl && (
                      <div className="bg-gray-100 rounded-lg p-4 mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Media File</div>
                            <div className="text-sm text-gray-500">Uploaded file</div>
                          </div>
                        </div>
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
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>Reply</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                        <span>Share</span>
                      </button>
                    </div>
                    
                    {/* Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                              {getUserInitials(comment.author)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{comment.author.name}</span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                              </div>
                              <p className="text-gray-700 text-sm">{comment.content}</p>
                              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                                <button className="hover:text-blue-600 transition-colors">Like</button>
                                <button className="hover:text-blue-600 transition-colors">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Comment Input */}
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                            {getUserInitials(currentUser)}
                          </div>
                          <div className="flex-1">
                            <input 
                              type="text" 
                              placeholder="Write a reply..." 
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
      />
    </div>
  );
};

export default TaskStream;
