/**
 * Get the base URL for the application
 * This function provides a consistent way to get the base URL across the application
 * and ensures production URLs are used instead of localhost
 */
export function getBaseUrl(): string {
  // Check for environment variables in order of preference
  if (typeof process !== 'undefined' && process.env) {
    // Server-side (API routes, etc.)
    return process.env.PUBLIC_SITE_URL || 
           process.env.BASE_URL || 
           process.env.SITE_URL || 
           'https://trackr.times10.net';
  } else if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Client-side (Astro pages, etc.)
    return import.meta.env.PUBLIC_SITE_URL || 
           import.meta.env.BASE_URL || 
           import.meta.env.SITE_URL || 
           'https://trackr.times10.net';
  }
  
  // Fallback to production URL
  return 'https://trackr.times10.net';
}

/**
 * Get the base URL for email links
 * This ensures email links always use the production domain
 */
export function getEmailBaseUrl(): string {
  return 'https://trackr.times10.net';
}
