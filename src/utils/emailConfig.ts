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
  senderEmail: 'support@trackr.times10.net', // Use a real email you can access for Gravatar
  replyTo: 'noreply@trackr.times10.net',
  senderAvatarUrl: 'https://trackr.times10.net/avatar.jpg', // Avatar for email clients
  
  // Branding
  companyName: 'Times10',
  logoUrl: '/tracker-logo-white.png', // Local trackr logo with red circular icon
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
  const logoUrl = emailConfig.logoUrl || '/tracker-logo-white.png';
  
  // If it's already an absolute URL, return it
  if (logoUrl.startsWith('http')) {
    return logoUrl;
  }
  
  // For local development, use localhost
  if (process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL) {
    return `http://localhost:4321${logoUrl}`;
  }
  
  // For production, use the website URL
  return `${emailConfig.websiteUrl}${logoUrl}`;
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
