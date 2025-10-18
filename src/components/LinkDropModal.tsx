import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Link, ExternalLink, Image, Globe } from 'lucide-react';
import SimpleTiptapEditor from './SimpleTiptapEditor';

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface LinkDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (linkData: LinkPreview, content: string, mentionedUsers: User[]) => void;
  teamMembers: User[];
  currentUser: User;
}

const LinkDropModal: React.FC<LinkDropModalProps> = ({ isOpen, onClose, onAddLink, teamMembers, currentUser }) => {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);






  const validateUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }, []);

  const extractDomain = useCallback((url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }, []);

  const fetchLinkPreview = useCallback(async (url: string): Promise<LinkPreview> => {
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch link preview');
      }

      const data = await response.json();
      return {
        url,
        title: data.title,
        description: data.description,
        image: data.image,
        domain: extractDomain(url),
      };
    } catch (error) {
      console.error('Error fetching link preview:', error);
      return {
        url,
        domain: extractDomain(url),
      };
    }
  }, [extractDomain]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');
    setPreview(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const linkPreview = await fetchLinkPreview(url);
      setPreview(linkPreview);
    } catch (error) {
      setError('Failed to fetch link preview. You can still add the link.');
    } finally {
      setIsLoading(false);
    }
  }, [url, validateUrl, fetchLinkPreview]);

  const handleAddLink = useCallback(() => {
    if (preview) {
      onAddLink(preview, content, mentionedUsers);
      setUrl('');
      setContent('');
      setPreview(null);
      setError('');
      setMentionedUsers([]);
      onClose();
    }
  }, [preview, content, mentionedUsers, onAddLink, onClose]);

  const handleClose = useCallback(() => {
    setUrl('');
    setContent('');
    setPreview(null);
    setError('');
    setMentionedUsers([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Link</h2>
              <p className="text-sm text-gray-500">Share a link with your team</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="https://example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Content Input */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Add a message (optional)
              </label>
              <SimpleTiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Leave a message or quick note here. @mention team members to notify them."
                className="w-full min-h-[120px] border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!url.trim() || isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Fetching Preview...</span>
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    <span>Get Preview</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preview */}
          {preview && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border max-w-[375px] w-full mx-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {preview.image && (
                  <div className="aspect-video bg-gray-100 max-h-48">
                    <img
                      src={preview.image}
                      alt={preview.title || 'Link preview'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {preview.title && (
                        <h4 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                          {preview.title}
                        </h4>
                      )}
                      {preview.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {preview.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{preview.domain}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            {preview && (
              <button
                onClick={handleAddLink}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Add Link
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default LinkDropModal;
