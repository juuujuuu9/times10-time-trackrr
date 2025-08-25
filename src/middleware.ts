import { defineMiddleware } from 'astro:middleware';

// Webhook endpoints that should bypass CSRF protection
const WEBHOOK_ENDPOINTS = new Set([
  '/api/slack/commands',
  '/api/slack/events',
  '/api/slack/interactivity',
  '/slack-test'
]);

// Temporarily disabled middleware to fix Slack webhook issues
export const onRequest = defineMiddleware(async (context, next) => {
  // Allow all requests for now to fix Slack webhook issues
  return next();
});
