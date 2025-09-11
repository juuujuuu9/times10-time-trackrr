/**
 * Email configuration for Times10 Time Tracker
 * Customize sender information, branding, and email templates
 */

export interface EmailConfig {
  // Sender information
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  senderAvatarUrl?: string; // Avatar that appears in email clients
  
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
  senderName: 'Times10 Trackr',
  senderEmail: 'noreply@trackr.times10.net', // Change this to a real email you can access for Gravatar
  replyTo: 'noreply@trackr.times10.net',
  senderAvatarUrl: 'https://trackr.times10.net/avatar.jpg', // Avatar for email clients
  
  // Branding
  companyName: 'Times10',
  logoUrl: 'https://trackr.times10.net/trackr-logo.png', // Your logo URL
  primaryColor: '#d63a2e',
  secondaryColor: '#415058',
  
  // Contact information
  supportEmail: 'noreply@trackr.times10.net',
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
 * Get the sender avatar URL for email clients
 * This is the avatar that appears in email clients like Gmail, Outlook
 */
export function getSenderAvatarUrl(): string {
  return emailConfig.senderAvatarUrl || `${emailConfig.websiteUrl}/trackr-icon.png`;
}

/**
 * Get email headers with avatar information
 * Some email clients use these headers to display avatars
 */
export function getEmailHeaders(): Record<string, string> {
  return {
    'X-Avatar-URL': getSenderAvatarUrl(),
    'X-Sender-Name': emailConfig.senderName,
    'X-Company': emailConfig.companyName,
  };
}
