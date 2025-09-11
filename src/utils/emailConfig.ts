/**
 * Email configuration for Times10 Time Tracker
 * Customize sender information, branding, and email templates
 */

export interface EmailConfig {
  // Sender information
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  
  // Branding
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Contact information
  supportEmail?: string;
  websiteUrl?: string;
}

// Default configuration - customize these values
export const emailConfig: EmailConfig = {
  // Sender information
  senderName: 'Times10 Team',
  senderEmail: 'noreply@trackr.times10.net',
  replyTo: 'support@trackr.times10.net',
  
  // Branding
  companyName: 'Times10',
  logoUrl: 'https://trackr.times10.net/trackr-logo.png', // Your logo URL
  primaryColor: '#d63a2e',
  secondaryColor: '#415058',
  
  // Contact information
  supportEmail: 'support@trackr.times10.net',
  websiteUrl: 'https://trackr.times10.net',
};

/**
 * Get the formatted sender string for Resend
 */
export function getSenderString(): string {
  return `${emailConfig.senderName} <${emailConfig.senderEmail}>`;
}

/**
 * Get the reply-to string for Resend
 */
export function getReplyToString(): string {
  return emailConfig.replyTo || emailConfig.senderEmail;
}

/**
 * Get the company logo URL
 */
export function getLogoUrl(): string {
  return emailConfig.logoUrl || `${emailConfig.websiteUrl}/trackr-logo.png`;
}

/**
 * Get the primary brand color
 */
export function getPrimaryColor(): string {
  return emailConfig.primaryColor;
}

/**
 * Get the secondary brand color
 */
export function getSecondaryColor(): string {
  return emailConfig.secondaryColor;
}

/**
 * Generate Gravatar URL for user avatar
 */
export function getGravatarUrl(email: string, size: number = 40): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Generate a simple avatar URL with initials
 */
export function getInitialsAvatar(name: string, size: number = 40): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const colors = ['#d63a2e', '#415058', '#1F292E', '#C8CDD0'];
  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${backgroundColor.replace('#', '')}&color=ffffff&bold=true`;
}
