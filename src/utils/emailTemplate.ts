/**
 * Shared Email Template Utilities
 * 
 * This module provides consistent email template styling across all email types
 * using the beautiful gradient header design from the mention email.
 */

import { getPrimaryColor, getSecondaryColor, getLogoUrl } from './emailConfig';

/**
 * Get the standard email template with gradient header styling
 */
export function getStandardEmailTemplate(options: {
  title: string;
  subtitle: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title}</title>
      <style>
        /* Reset and base styles */
        body { 
          font-family: 'Istok Web', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #1F292E; 
          background-color: #F2F2F3; 
          margin: 0; 
          padding: 0; 
        }
        
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #FFFFFF; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        
        .header { 
          background: linear-gradient(135deg, #d63a2e 0%, #415058 100%); 
          padding: 32px 24px; 
          text-align: center; 
          color: white; 
        }
        
        
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
          color: white; 
        }
        
        .header p {
          margin: 8px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content { 
          padding: 32px 24px; 
        }
        
        .button { 
          display: inline-block; 
          background: #d63a2e; 
          color: #FFFFFF !important; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 0; 
          transition: all 0.2s; 
          box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
        }
        
        .button:hover { 
          background: #b52a24;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(214, 58, 46, 0.3);
        }
        
        .info-card { 
          background-color: #F9FAFB; 
          border: 1px solid #E5E7EB; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0; 
        }
        
        .info-card h3 {
          margin-top: 0;
          color: ${getPrimaryColor()};
          font-size: 18px;
          font-weight: 600;
        }
        
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          color: #6B7280; 
          font-size: 14px; 
          border-top: 1px solid #E5E7EB;
          padding-top: 20px;
        }
        
        /* Text color classes */
        .highlight { color: ${getPrimaryColor()}; }
        .text-dark { color: #1F292E; }
        .text-mid { color: #6B7280; }
        .text-light { color: #9CA3AF; }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .content {
            background: #1a1a1a;
            color: #ffffff;
          }
          .info-card {
            background: #2a2a2a;
            border-color: #444;
          }
          .text-dark { color: #ffffff; }
          .text-mid { color: #cccccc; }
          .text-light { color: #999999; }
          .footer { 
            color: #cccccc; 
            border-color: #444;
          }
        }
        
        /* Mobile responsiveness */
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .header, .content { padding: 20px; }
          .header h1 { font-size: 20px; }
          .header p { font-size: 14px; }
          .info-card { padding: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${options.title}</h1>
          <p>${options.subtitle}</p>
        </div>
        
        <div class="content">
          ${options.content}
          
          ${options.buttonText && options.buttonUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${options.buttonUrl}" class="button">${options.buttonText}</a>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>${options.footerText || 'This email was sent from Times10 Trackr'}</p>
          <p>If you no longer want to receive these notifications, please contact your team administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create a standard info card for email content
 */
export function createInfoCard(title: string, items: Array<{label: string, value: string}>) {
  return `
    <div class="info-card">
      <h3>${title}</h3>
      ${items.map(item => `
        <p><strong>${item.label}:</strong> ${item.value}</p>
      `).join('')}
    </div>
  `;
}

/**
 * Create a content preview box
 */
export function createContentPreview(content: string, maxLength: number = 200) {
  const preview = content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  return `
    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0; font-style: italic; color: #6B7280;">
      <strong>Preview:</strong><br>
      "${preview}"
    </div>
  `;
}
