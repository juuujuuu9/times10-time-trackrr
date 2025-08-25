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
  
  // Temporarily disable CSRF protection for all Slack endpoints
  if (url.pathname.startsWith('/api/slack/') || url.pathname === '/slack-test') {
    console.log('Bypassing CSRF for Slack endpoint:', url.pathname);
    return next();
  }
  
  // Check if this is a POST request to a webhook endpoint
  if (request.method === 'POST' && WEBHOOK_ENDPOINTS.has(url.pathname)) {
    // Allow webhook requests without CSRF checks
    console.log('Allowing webhook request to:', url.pathname);
    return next();
  }
  
  // For all other POST requests, check origin
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');
    
    // Allow requests with no origin (like Slack webhooks)
    if (!origin) {
      console.log('Allowing request with no origin');
      return next();
    }
    
    // Allow Slack webhook requests specifically
    if (userAgent && userAgent.includes('Slackbot')) {
      console.log('Allowing Slack webhook request');
      return next();
    }
    
    // Check if origin matches the site
    const siteOrigin = new URL(url).origin;
    if (origin !== siteOrigin) {
      console.log('Blocking cross-origin request from:', origin);
      return new Response('Cross-site POST form submissions are forbidden', { 
        status: 403 
      });
    }
  }
  
  return next();
});
