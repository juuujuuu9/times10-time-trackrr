/**
 * Local Email Debug Utilities
 * 
 * This module provides local email debugging functionality when running
 * the application in development mode without external email services.
 */

import nodemailer from 'nodemailer';

// Check if we're in local debug mode
export const isLocalDebugMode = (): boolean => {
  return process.env.EMAIL_DEBUG_MODE === 'true' || 
         process.env.RESEND_API_KEY === 'local-debug-mode' ||
         !process.env.RESEND_API_KEY ||
         process.env.RESEND_API_KEY === 'your_resend_api_key_here';
};

// Create local SMTP transporter for debugging
export const createLocalTransporter = () => {
  if (!isLocalDebugMode()) {
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email using local SMTP for debugging
export const sendLocalDebugEmail = async (emailData: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) => {
  if (!isLocalDebugMode()) {
    return null;
  }

  const transporter = createLocalTransporter();
  if (!transporter) {
    console.log('📧 LOCAL DEBUG: No SMTP transporter available');
    return null;
  }

  try {
    console.log('📧 LOCAL DEBUG: Sending email via local SMTP...');
    console.log('📧 From:', emailData.from);
    console.log('📧 To:', emailData.to);
    console.log('📧 Subject:', emailData.subject);
    
    const result = await transporter.sendMail(emailData);
    console.log('📧 LOCAL DEBUG: Email sent successfully:', result.messageId);
    console.log('📧 LOCAL DEBUG: View at http://localhost:1080');
    
    return { id: result.messageId, success: true };
  } catch (error) {
    console.error('📧 LOCAL DEBUG: Failed to send email:', error);
    return { id: 'local-debug-error', success: false, error };
  }
};

// Log email details for debugging
export const logEmailDebugInfo = (emailType: string, data: any) => {
  if (!isLocalDebugMode()) {
    return;
  }

  console.log(`\n📧 LOCAL DEBUG: ${emailType.toUpperCase()} EMAIL`);
  console.log('=' .repeat(50));
  console.log('📧 Email Type:', emailType);
  console.log('📧 Recipient:', data.email);
  console.log('📧 Subject:', data.subject || 'Generated from template');
  console.log('📧 Data:', JSON.stringify(data, null, 2));
  console.log('📧 View captured emails at: http://localhost:1080');
  console.log('=' .repeat(50));
  console.log('');
};

