import type { APIRoute } from 'astro';
import { JSDOM } from 'jsdom';
import { extractGoogleWorkspaceInfo, type GoogleWorkspaceInfo } from '../../utils/googleWorkspace';

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  googleWorkspaceInfo?: GoogleWorkspaceInfo;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({
        success: false,
        message: 'URL is required',
        error: 'Missing URL parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid URL format',
        error: 'URL must be a valid HTTP or HTTPS URL'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract Open Graph metadata
    const getMetaContent = (property: string): string | undefined => {
      const meta = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`);
      return meta?.getAttribute('content') || undefined;
    };

    const title = getMetaContent('og:title') || 
                 document.querySelector('title')?.textContent?.trim() ||
                 getMetaContent('twitter:title');

    const description = getMetaContent('og:description') || 
                      getMetaContent('description') ||
                      getMetaContent('twitter:description');

    const image = getMetaContent('og:image') || 
                 getMetaContent('twitter:image') ||
                 getMetaContent('twitter:image:src');

    // Clean up image URL if it's relative
    let imageUrl = image;
    if (image && !image.startsWith('http')) {
      try {
        imageUrl = new URL(image, url).toString();
      } catch {
        imageUrl = undefined;
      }
    }

    // Check if it's a Google Workspace document
    const gwsInfo = extractGoogleWorkspaceInfo(url);
    
    const previewData: LinkPreviewData = {
      title: title || undefined,
      description: description || undefined,
      image: imageUrl || undefined,
      url: url,
      googleWorkspaceInfo: gwsInfo || undefined
    };

    // If it's a Google Workspace document and we don't have a title, try to extract from URL
    if (gwsInfo && !title) {
      // For Google Workspace, we can't reliably extract the title from the URL alone
      // The title would need to come from the HTML or be set by the user
      // For now, we'll leave it undefined and let the frontend handle it
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Link preview fetched successfully',
      data: previewData,
      ...previewData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching link preview:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch link preview',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
