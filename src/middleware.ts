import { defineMiddleware } from 'astro:middleware';

// Webhook endpoints that should bypass CSRF protection
const WEBHOOK_ENDPOINTS = new Set([
  '/api/slack/commands',
  '/api/slack/events',
  '/api/slack/interactivity',
  '/slack-test'
]);

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  
  // Check if this is a POST request to a webhook endpoint
  if (request.method === 'POST' && WEBHOOK_ENDPOINTS.has(url.pathname)) {
    // Allow webhook requests without CSRF checks
    return next();
  }
  
  // For all other POST requests, check origin
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Allow requests with no origin (like Slack webhooks)
    if (!origin) {
      return next();
    }
    
    // Check if origin matches the site
    const siteOrigin = new URL(url).origin;
    if (origin !== siteOrigin) {
      return new Response('Cross-site POST form submissions are forbidden', { 
        status: 403 
      });
    }
  }
  
  return next();
});
