import React from 'react';
import { ExternalLink, Globe, Image as ImageIcon } from 'lucide-react';
import { extractGoogleWorkspaceInfo, getGoogleWorkspaceTypeName, type GoogleWorkspaceInfo } from '../utils/googleWorkspace';

interface LinkPreviewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  className?: string;
  googleWorkspaceInfo?: GoogleWorkspaceInfo;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({
  url,
  title,
  description,
  image,
  domain,
  className = '',
  googleWorkspaceInfo
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetUrl = googleWorkspaceInfo?.viewUrl || url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const displayDomain = domain || (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  // If it's a Google Workspace document, show embeddable preview
  const gwsInfo = googleWorkspaceInfo || extractGoogleWorkspaceInfo(url);
  const isGoogleWorkspace = !!gwsInfo;
  const canEmbed = gwsInfo && (gwsInfo.type === 'docs' || gwsInfo.type === 'sheets' || gwsInfo.type === 'slides' || gwsInfo.type === 'forms');

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      {/* Google Workspace Embed Preview */}
      {isGoogleWorkspace && canEmbed && (
        <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
          <iframe
            src={gwsInfo.embedUrl}
            className="w-full h-full border-0"
            style={{ minHeight: '400px' }}
            title={title || getGoogleWorkspaceTypeName(gwsInfo.type)}
            allow="clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
        </div>
      )}

      {/* Regular Image Preview (only if not Google Workspace or if Google Workspace doesn't support embedding) */}
      {(!isGoogleWorkspace || !canEmbed) && image && (
        <div className="aspect-video bg-gray-100 relative">
          <img
            src={image}
            alt={title || 'Link preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Google Workspace Badge */}
            {isGoogleWorkspace && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {getGoogleWorkspaceTypeName(gwsInfo.type)}
                </span>
              </div>
            )}

            {/* Title */}
            {title ? (
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {displayDomain}
              </h3>
            )}

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {description}
              </p>
            )}

            {/* Domain */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{displayDomain}</span>
            </div>
          </div>

          {/* External link icon */}
          <div className="flex-shrink-0 ml-3">
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-lg transition-colors pointer-events-none" />
    </div>
  );
};

export default LinkPreview;
