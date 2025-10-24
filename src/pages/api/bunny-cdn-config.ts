import type { APIRoute } from 'astro';
import { getSessionUser } from '../../utils/session';

/**
 * API endpoint to get Bunny CDN configuration for direct uploads
 * This provides the necessary credentials for frontend direct uploads
 */
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const currentUser = await getSessionUser(context);
    if (!currentUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return Bunny CDN configuration for direct uploads
    const config = {
      storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME,
      storageZonePassword: process.env.BUNNY_STORAGE_ZONE_PASSWORD,
      storageZoneRegion: process.env.BUNNY_STORAGE_ZONE_REGION || 'la',
      cdnUrl: process.env.BUNNY_CDN_URL
    };

    // Validate that all required config is available
    if (!config.storageZoneName || !config.storageZonePassword || !config.cdnUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bunny CDN configuration is incomplete'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: config
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting Bunny CDN config:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get Bunny CDN configuration'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
