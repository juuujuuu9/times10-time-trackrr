/**
 * Utility functions for Google Workspace (Docs, Sheets, Slides, etc.) integration
 */

export type GoogleWorkspaceType = 'docs' | 'sheets' | 'slides' | 'forms' | 'drawings' | 'unknown';

export interface GoogleWorkspaceInfo {
  type: GoogleWorkspaceType;
  documentId: string;
  originalUrl: string;
  embedUrl: string;
  viewUrl: string;
  title?: string;
}

/**
 * Detects if a URL is a Google Workspace document
 */
export function isGoogleWorkspaceUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return (
      hostname.includes('docs.google.com') ||
      hostname.includes('drive.google.com')
    );
  } catch {
    return false;
  }
}

/**
 * Extracts Google Workspace document information from a URL
 */
export function extractGoogleWorkspaceInfo(url: string): GoogleWorkspaceInfo | null {
  if (!isGoogleWorkspaceUrl(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract document ID from various Google Workspace URL formats
    const patterns = [
      // Docs: /document/d/{id}/edit or /document/d/{id}
      /\/document\/d\/([a-zA-Z0-9_-]+)/,
      // Sheets: /spreadsheets/d/{id}/edit or /spreadsheets/d/{id}
      /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
      // Slides: /presentation/d/{id}/edit or /presentation/d/{id}
      /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
      // Forms: /forms/d/{id}/edit or /forms/d/{id}
      /\/forms\/d\/([a-zA-Z0-9_-]+)/,
      // Drawings: /drawings/d/{id}/edit or /drawings/d/{id}
      /\/drawings\/d\/([a-zA-Z0-9_-]+)/,
      // Drive: /file/d/{id}/view (generic)
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
    ];

    let documentId: string | null = null;
    let type: GoogleWorkspaceType = 'unknown';

    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match) {
        documentId = match[1];
        
        // Determine type based on path
        if (pathname.includes('/document/')) {
          type = 'docs';
        } else if (pathname.includes('/spreadsheets/')) {
          type = 'sheets';
        } else if (pathname.includes('/presentation/')) {
          type = 'slides';
        } else if (pathname.includes('/forms/')) {
          type = 'forms';
        } else if (pathname.includes('/drawings/')) {
          type = 'drawings';
        } else if (pathname.includes('/file/')) {
          // Generic Drive file - try to determine from mime type or assume docs
          type = 'docs';
        }
        
        break;
      }
    }

    if (!documentId) {
      return null;
    }

    // Build embed and view URLs based on type
    let embedUrl: string;
    let viewUrl: string;

    switch (type) {
      case 'docs':
        embedUrl = `https://docs.google.com/document/d/${documentId}/preview`;
        viewUrl = `https://docs.google.com/document/d/${documentId}/edit`;
        break;
      case 'sheets':
        embedUrl = `https://docs.google.com/spreadsheets/d/${documentId}/preview`;
        viewUrl = `https://docs.google.com/spreadsheets/d/${documentId}/edit`;
        break;
      case 'slides':
        embedUrl = `https://docs.google.com/presentation/d/${documentId}/preview`;
        viewUrl = `https://docs.google.com/presentation/d/${documentId}/edit`;
        break;
      case 'forms':
        embedUrl = `https://docs.google.com/forms/d/${documentId}/viewform?embedded=true`;
        viewUrl = `https://docs.google.com/forms/d/${documentId}/viewform`;
        break;
      case 'drawings':
        embedUrl = `https://docs.google.com/drawings/d/${documentId}/preview`;
        viewUrl = `https://docs.google.com/drawings/d/${documentId}/edit`;
        break;
      default:
        embedUrl = `https://drive.google.com/file/d/${documentId}/preview`;
        viewUrl = `https://drive.google.com/file/d/${documentId}/view`;
    }

    return {
      type,
      documentId,
      originalUrl: url,
      embedUrl,
      viewUrl,
    };
  } catch (error) {
    console.error('Error extracting Google Workspace info:', error);
    return null;
  }
}

/**
 * Gets a friendly name for Google Workspace document types
 */
export function getGoogleWorkspaceTypeName(type: GoogleWorkspaceType): string {
  const names: Record<GoogleWorkspaceType, string> = {
    docs: 'Google Docs',
    sheets: 'Google Sheets',
    slides: 'Google Slides',
    forms: 'Google Forms',
    drawings: 'Google Drawings',
    unknown: 'Google Workspace',
  };
  return names[type];
}

/**
 * Gets an icon for Google Workspace document types
 */
export function getGoogleWorkspaceIcon(type: GoogleWorkspaceType): string {
  const icons: Record<GoogleWorkspaceType, string> = {
    docs: '📄',
    sheets: '📊',
    slides: '📽️',
    forms: '📋',
    drawings: '🎨',
    unknown: '📎',
  };
  return icons[type];
}
