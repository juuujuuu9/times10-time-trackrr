/**
 * Utility functions for Figma integration
 */

export interface FigmaInfo {
  fileId: string;
  fileName?: string;
  nodeId?: string;
  originalUrl: string;
  embedUrl: string;
  viewUrl: string;
}

/**
 * Detects if a URL is a Figma file
 */
export function isFigmaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return (
      hostname === 'figma.com' ||
      hostname === 'www.figma.com' ||
      hostname.includes('figma.com')
    );
  } catch {
    return false;
  }
}

/**
 * Extracts Figma file information from a URL
 */
export function extractFigmaInfo(url: string): FigmaInfo | null {
  if (!isFigmaUrl(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract file ID and node ID from various Figma URL formats
    // Formats:
    // - /file/{fileId}/{fileName}
    // - /design/{fileId}/{fileName}
    // - /proto/{fileId}/{fileName}
    // - /file/{fileId}/{fileName}?node-id={nodeId}
    const patterns = [
      /\/file\/([a-zA-Z0-9_-]+)/,
      /\/design\/([a-zA-Z0-9_-]+)/,
      /\/proto\/([a-zA-Z0-9_-]+)/,
    ];

    let fileId: string | null = null;
    let fileName: string | undefined;
    let nodeId: string | undefined;

    // Extract file ID
    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match) {
        fileId = match[1];
        
        // Try to extract fileName from pathname (after file ID)
        const pathParts = pathname.split('/');
        const fileIndex = pathParts.findIndex(part => part === fileId);
        if (fileIndex >= 0 && fileIndex < pathParts.length - 1) {
          fileName = pathParts[fileIndex + 1];
        }
        
        break;
      }
    }

    if (!fileId) {
      return null;
    }

    // Extract node ID from query parameters
    const nodeIdParam = urlObj.searchParams.get('node-id');
    if (nodeIdParam) {
      // Convert node-id format (e.g., "1-2" to "1:2" for embed)
      nodeId = nodeIdParam.replace(/-/g, ':');
    }

    // Build embed URL
    // Figma embed format: https://www.figma.com/embed?embed_host=...&url={encodedUrl}
    const encodedUrl = encodeURIComponent(url);
    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodedUrl}`;

    // View URL is the original URL
    const viewUrl = url;

    return {
      fileId,
      fileName,
      nodeId,
      originalUrl: url,
      embedUrl,
      viewUrl,
    };
  } catch (error) {
    console.error('Error extracting Figma info:', error);
    return null;
  }
}

