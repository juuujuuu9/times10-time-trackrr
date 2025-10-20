import { Resend } from 'resend';
import { getSenderString, getReplyToString, getLogoUrl, getPrimaryColor, getSecondaryColor, getEmailHeaders } from './emailConfig';

// Only initialize Resend if we have a valid API key
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  return new Resend(apiKey);
};

export interface InvitationEmailData {
  email: string;
  name: string;
  role: string;
  invitationUrl: string;
  invitedBy: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  // Check if we have a valid Resend API key configured
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Invitation would be sent to:', data.email);
    console.log('📧 Invitation URL:', data.invitationUrl);
    console.log('📧 Invitation Details:', {
      name: data.name,
      role: data.role,
      invitedBy: data.invitedBy,
      email: data.email
    });
    
    // Return success for testing
    return { id: 'test-invitation-' + Date.now() };
  }

  try {

    // Log the attempt for debugging
    console.log('📧 Attempting to send invitation email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `You've been invited to join Times10 Time Tracker`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Times10 Invitation</title>
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
            
            /* Container and layout */
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            
            /* Header with brand color */
            .header { 
              background: #d63a2e; 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            
            /* Content area */
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #C8CDD0; 
              border-top: none;
            }
            
            /* Button styling */
            .button { 
              display: inline-block; 
              background: #d63a2e; 
              color: #FFFFFF !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0; 
              transition: background-color 0.2s; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .button:hover { 
              background: #b52a24; 
            }
            
            /* Footer */
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #415058; 
              font-size: 14px; 
            }
            
            /* Text color classes */
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .content {
                background: #1a1a1a;
                color: #ffffff;
                border-color: #333;
              }
              .text-dark { color: #ffffff; }
              .text-mid { color: #cccccc; }
              .text-light { color: #999999; }
              .footer { color: #cccccc; }
            }
            
            /* Mobile responsiveness */
            @media (max-width: 600px) {
              .container { padding: 10px; }
              .header, .content { padding: 20px; }
              .header h1 { font-size: 20px; }
              .header p { font-size: 14px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Times10 Logo" class="header-logo" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
              <h1>🚀 Welcome to Times10!</h1>
              <p>You've been invited to join our time tracking platform</p>
            </div>
            <div class="content">
              <h2 class="text-dark">Hi ${data.name},</h2>
              <p class="text-mid">You've been invited by <strong class="highlight">${data.invitedBy}</strong> to join Times10 Time Tracker as a <strong class="highlight">${data.role === 'admin' ? 'admin' : 'Team Member'}</strong>.</p>
              
              <p class="text-mid">Times10 is a powerful time tracking platform that helps teams manage their time, projects, and productivity.</p>
              
              <div style="text-align: center;">
                <a href="${data.invitationUrl}" class="button">Set Up Your Account</a>
              </div>
              
              <p class="text-dark"><strong>What you can do with Times10:</strong></p>
              <ul class="text-mid">
                <li>Track time on projects and tasks</li>
                <li>View detailed reports and analytics</li>
                <li>Collaborate with your team</li>
                <li>Manage projects and clients</li>
              </ul>
              
              <p class="text-mid"><strong>Important:</strong> This invitation link will expire in 24 hours for security reasons.</p>
              
              <p class="text-mid">If you have any questions, please contact your team administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Times10 Time Tracker</p>
              <p>If you didn't expect this invitation, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if ((error as any).statusCode === 403) {
        throw new Error('Email service error: Please verify your domain at resend.com/domains or check your API key configuration.');
      }
      throw new Error(`Failed to send invitation email: ${(error as any).message || 'Unknown error'}`);
    }

    return emailData;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    throw error;
  }
} 

export interface TaskAssignmentEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  assignedBy: string;
  taskDescription?: string;
  dashboardUrl: string;
}

export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetUrl: string;
}

export interface CollaborationAssignmentEmailData {
  email: string;
  userName: string;
  collaborationName: string;
  projectName: string;
  addedBy: string;
  collaborationDescription?: string;
  dashboardUrl: string;
}

export interface SubtaskAssignmentEmailData {
  email: string;
  userName: string;
  subtaskName: string;
  taskName: string;
  projectName: string;
  assignedBy: string;
  subtaskDescription?: string;
  dashboardUrl: string;
}

export interface MentionNotificationEmailData {
  email: string;
  userName: string;
  mentionedBy: string;
  content: string;
  taskName: string;
  projectName: string;
  taskStreamUrl: string;
  postType: string;
}

export async function sendTaskAssignmentEmail(data: TaskAssignmentEmailData) {
  // Check if we have a valid Resend API key configured
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Task assignment notification would be sent to:', data.email);
    console.log('📧 Task Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      assignedBy: data.assignedBy,
      taskDescription: data.taskDescription,
      dashboardUrl: data.dashboardUrl
    });
    
    // Return success for testing
    return { id: 'test-task-assignment-' + Date.now() };
  }

  try {

    // Log the attempt for debugging
    console.log('📧 Attempting to send task assignment email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `New Task Assigned: ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Task Assignment</title>
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
            
            /* Container and layout */
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            
            /* Header with brand color */
            .header { 
              background: #d63a2e; 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            
            /* Content area */
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #C8CDD0; 
              border-top: none;
            }
            
            /* Button styling */
            .button { 
              display: inline-block; 
              background: #d63a2e; 
              color: #FFFFFF !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0; 
              transition: background-color 0.2s; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .button:hover { 
              background: #b52a24; 
            }
            
            /* Task card styling */
            .task-card { 
              background: #F2F2F3; 
              border: 1px solid #C8CDD0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            
            .task-card h3 {
              margin-top: 0;
              color: #d63a2e;
              font-size: 18px;
              font-weight: bold;
            }
            
            /* Footer */
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #415058; 
              font-size: 14px; 
            }
            
            /* Text color classes */
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .content {
                background: #1a1a1a;
                color: #ffffff;
                border-color: #333;
              }
              .task-card {
                background: #2a2a2a;
                border-color: #444;
              }
              .text-dark { color: #ffffff; }
              .text-mid { color: #cccccc; }
              .text-light { color: #999999; }
              .footer { color: #cccccc; }
            }
            
            /* Mobile responsiveness */
            @media (max-width: 600px) {
              .container { padding: 10px; }
              .header, .content { padding: 20px; }
              .header h1 { font-size: 20px; }
              .header p { font-size: 14px; }
              .task-card { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Task Assignment</h1>
              <p>You have been assigned a new task</p>
            </div>
            <div class="content">
              <h2 class="text-dark">Hi ${data.userName},</h2>
              <p class="text-mid">You have been assigned a new task by <strong class="highlight">${data.assignedBy}</strong>.</p>
              
              <div class="task-card">
                <h3>${data.taskName}</h3>
                <p class="text-mid"><strong>Project:</strong> ${data.projectName}</p>
                ${data.taskDescription ? `<p class="text-mid"><strong>Description:</strong> ${data.taskDescription}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Task in Dashboard</a>
              </div>
              
              <p class="text-dark"><strong>What you can do:</strong></p>
              <ul class="text-mid">
                <li>Start tracking time on this task</li>
                <li>Add notes and updates</li>
                <li>Mark the task as complete when finished</li>
                <li>View progress and time spent</li>
              </ul>
              
              <p class="text-mid">If you have any questions about this task, please contact ${data.assignedBy}.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Times10 Time Tracker</p>
              <p>You can manage your email preferences in your account settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending task assignment email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if ((error as any).statusCode === 403) {
        throw new Error('Email service error: Please verify your domain at resend.com/domains or check your API key configuration.');
      }
      throw new Error(`Failed to send task assignment email: ${(error as any).message || 'Unknown error'}`);
    }

    return emailData;
  } catch (error) {
    console.error('Error in sendTaskAssignmentEmail:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  // Check if we have a valid Resend API key configured
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Password reset email would be sent to:', data.email);
    console.log('📧 Reset URL:', data.resetUrl);
    console.log('📧 User Details:', {
      name: data.name,
      email: data.email
    });
    
    // Return success for testing
    return { id: 'test-password-reset-' + Date.now() };
  }

  try {
    // Log the attempt for debugging
    console.log('📧 Attempting to send password reset email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: 'Reset Your Times10 Password',
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Times10</title>
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
            
            /* Container and layout */
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            
            /* Header with brand color */
            .header { 
              background: #d63a2e; 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            
            /* Content area */
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #C8CDD0; 
              border-top: none;
            }
            
            /* Button styling */
            .button { 
              display: inline-block; 
              background: #d63a2e; 
              color: #FFFFFF !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0; 
              transition: background-color 0.2s; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .button:hover { 
              background: #b52a24; 
            }
            
            /* Security notice */
            .security-notice { 
              background: #F2F2F3; 
              border: 1px solid #C8CDD0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            
            .security-notice h3 {
              margin-top: 0;
              color: #d63a2e;
              font-size: 16px;
              font-weight: bold;
            }
            
            /* Footer */
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #415058; 
              font-size: 14px; 
            }
            
            /* Text color classes */
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .content {
                background: #1a1a1a;
                color: #ffffff;
                border-color: #333;
              }
              .security-notice {
                background: #2a2a2a;
                border-color: #444;
              }
              .text-dark { color: #ffffff; }
              .text-mid { color: #cccccc; }
              .text-light { color: #999999; }
              .footer { color: #cccccc; }
            }
            
            /* Mobile responsiveness */
            @media (max-width: 600px) {
              .container { padding: 10px; }
              .header, .content { padding: 20px; }
              .header h1 { font-size: 20px; }
              .header p { font-size: 14px; }
              .security-notice { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>Reset your Times10 Time Tracker password</p>
            </div>
            <div class="content">
              <h2 class="text-dark">Hi ${data.name},</h2>
              <p class="text-mid">We received a request to reset your password for your Times10 Time Tracker account.</p>
              
              <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <div class="security-notice">
                <h3>🔒 Security Information</h3>
                <ul class="text-mid">
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this password reset, please ignore this email</li>
                  <li>Your password will not be changed until you click the link above</li>
                  <li>For security, this link can only be used once</li>
                </ul>
              </div>
              
              <p class="text-mid">If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p class="text-light" style="word-break: break-all; font-size: 12px;">${data.resetUrl}</p>
              
              <p class="text-mid">If you have any questions or concerns, please contact your system administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Times10 Time Tracker</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if ((error as any).statusCode === 403) {
        throw new Error('Email service error: Please verify your domain at resend.com/domains or check your API key configuration.');
      }
      throw new Error(`Failed to send password reset email: ${(error as any).message || 'Unknown error'}`);
    }

    return emailData;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    throw error;
  }
}

export async function sendCollaborationAssignmentEmail(data: CollaborationAssignmentEmailData) {
  // Check if we have a valid Resend API key configured
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Collaboration assignment notification would be sent to:', data.email);
    console.log('📧 Collaboration Details:', {
      userName: data.userName,
      collaborationName: data.collaborationName,
      projectName: data.projectName,
      addedBy: data.addedBy,
      collaborationDescription: data.collaborationDescription,
      dashboardUrl: data.dashboardUrl
    });
    
    // Return success for testing
    return { id: 'test-collaboration-assignment-' + Date.now() };
  }

  try {
    // Log the attempt for debugging
    console.log('📧 Attempting to send collaboration assignment email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `You've been added to a collaboration: ${data.collaborationName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Collaboration Assignment</title>
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
            
            /* Container and layout */
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            
            /* Header with brand color */
            .header { 
              background: #d63a2e; 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            
            /* Content area */
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #C8CDD0; 
              border-top: none;
            }
            
            /* Button styling */
            .button { 
              display: inline-block; 
              background: #d63a2e; 
              color: #FFFFFF !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0; 
              transition: background-color 0.2s; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .button:hover { 
              background: #b52a24; 
            }
            
            /* Collaboration card styling */
            .collaboration-card { 
              background: #F2F2F3; 
              border: 1px solid #C8CDD0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            
            .collaboration-card h3 {
              margin-top: 0;
              color: #d63a2e;
              font-size: 18px;
              font-weight: bold;
            }
            
            /* Footer */
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #415058; 
              font-size: 14px; 
            }
            
            /* Text color classes */
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .content {
                background: #1a1a1a;
                color: #ffffff;
                border-color: #333;
              }
              .collaboration-card {
                background: #2a2a2a;
                border-color: #444;
              }
              .text-dark { color: #ffffff; }
              .text-mid { color: #cccccc; }
              .text-light { color: #999999; }
              .footer { color: #cccccc; }
            }
            
            /* Mobile responsiveness */
            @media (max-width: 600px) {
              .container { padding: 10px; }
              .header, .content { padding: 20px; }
              .header h1 { font-size: 20px; }
              .header p { font-size: 14px; }
              .collaboration-card { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤝 Collaboration Assignment</h1>
              <p>You have been added to a collaboration</p>
            </div>
            <div class="content">
              <h2 class="text-dark">Hi ${data.userName},</h2>
              <p class="text-mid">You have been added to a collaboration by <strong class="highlight">${data.addedBy}</strong>.</p>
              
              <div class="collaboration-card">
                <h3>${data.collaborationName}</h3>
                <p class="text-mid"><strong>Project:</strong> ${data.projectName}</p>
                ${data.collaborationDescription ? `<p class="text-mid"><strong>Description:</strong> ${data.collaborationDescription}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Collaboration</a>
              </div>
              
              <p class="text-dark"><strong>What you can do:</strong></p>
              <ul class="text-mid">
                <li>View and participate in team discussions</li>
                <li>Access shared tasks and resources</li>
                <li>Collaborate with team members</li>
                <li>Track progress and updates</li>
              </ul>
              
              <p class="text-mid">If you have any questions about this collaboration, please contact ${data.addedBy}.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Times10 Time Tracker</p>
              <p>You can manage your email preferences in your account settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending collaboration assignment email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if ((error as any).statusCode === 403) {
        throw new Error('Email service error: Please verify your domain at resend.com/domains or check your API key configuration.');
      }
      throw new Error(`Failed to send collaboration assignment email: ${(error as any).message || 'Unknown error'}`);
    }

    return emailData;
  } catch (error) {
    console.error('Error in sendCollaborationAssignmentEmail:', error);
    throw error;
  }
}

export async function sendSubtaskAssignmentEmail(data: SubtaskAssignmentEmailData) {
  // Check if we have a valid Resend API key configured
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Subtask assignment notification would be sent to:', data.email);
    console.log('📧 Subtask Details:', {
      userName: data.userName,
      subtaskName: data.subtaskName,
      taskName: data.taskName,
      projectName: data.projectName,
      assignedBy: data.assignedBy,
      subtaskDescription: data.subtaskDescription,
      dashboardUrl: data.dashboardUrl
    });
    
    // Return success for testing
    return { id: 'test-subtask-assignment-' + Date.now() };
  }

  try {
    // Log the attempt for debugging
    console.log('📧 Attempting to send subtask assignment email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `You've been assigned a subtask: ${data.subtaskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subtask Assignment</title>
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
            
            /* Container and layout */
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            
            /* Header with brand color */
            .header { 
              background: #d63a2e; 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            
            /* Content area */
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
              border: 1px solid #C8CDD0; 
              border-top: none;
            }
            
            /* Button styling */
            .button { 
              display: inline-block; 
              background: #d63a2e; 
              color: #FFFFFF !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0; 
              transition: background-color 0.2s; 
              box-shadow: 0 2px 4px rgba(214, 58, 46, 0.2);
            }
            
            .button:hover { 
              background: #b52a24; 
            }
            
            /* Subtask card styling */
            .subtask-card { 
              background: #F2F2F3; 
              border: 1px solid #C8CDD0; 
              border-radius: 8px; 
              padding: 20px; 
              margin: 20px 0; 
            }
            
            .subtask-card h3 {
              margin-top: 0;
              color: #d63a2e;
              font-size: 18px;
              font-weight: bold;
            }
            
            /* Footer */
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #415058; 
              font-size: 14px; 
            }
            
            /* Text color classes */
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .content {
                background: #1a1a1a;
                color: #ffffff;
                border-color: #333;
              }
              .subtask-card {
                background: #2a2a2a;
                border-color: #444;
              }
              .text-dark { color: #ffffff; }
              .text-mid { color: #cccccc; }
              .text-light { color: #999999; }
              .footer { color: #cccccc; }
            }
            
            /* Mobile responsiveness */
            @media (max-width: 600px) {
              .container { padding: 10px; }
              .header, .content { padding: 20px; }
              .header h1 { font-size: 20px; }
              .header p { font-size: 14px; }
              .subtask-card { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Subtask Assignment</h1>
              <p>You have been assigned a subtask</p>
            </div>
            <div class="content">
              <h2 class="text-dark">Hi ${data.userName},</h2>
              <p class="text-mid">You have been assigned a subtask by <strong class="highlight">${data.assignedBy}</strong>.</p>
              
              <div class="subtask-card">
                <h3>${data.subtaskName}</h3>
                <p class="text-mid"><strong>Task:</strong> ${data.taskName}</p>
                <p class="text-mid"><strong>Project:</strong> ${data.projectName}</p>
                ${data.subtaskDescription ? `<p class="text-mid"><strong>Description:</strong> ${data.subtaskDescription}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Subtask</a>
              </div>
              
              <p class="text-dark"><strong>What you can do:</strong></p>
              <ul class="text-mid">
                <li>Start tracking time on this subtask</li>
                <li>Add notes and updates</li>
                <li>Mark the subtask as complete when finished</li>
                <li>View progress and time spent</li>
              </ul>
              
              <p class="text-mid">If you have any questions about this subtask, please contact ${data.assignedBy}.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Times10 Time Tracker</p>
              <p>You can manage your email preferences in your account settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending subtask assignment email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if ((error as any).statusCode === 403) {
        throw new Error('Email service error: Please verify your domain at resend.com/domains or check your API key configuration.');
      }
      throw new Error(`Failed to send subtask assignment email: ${(error as any).message || 'Unknown error'}`);
    }

    return emailData;
  } catch (error) {
    console.error('Error in sendSubtaskAssignmentEmail:', error);
    throw error;
  }
}

export async function sendMentionNotificationEmail(data: MentionNotificationEmailData) {
  // Check if we have a valid Resend API key configured
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Mention notification would be sent to:', data.email);
    console.log('📧 Mention Details:', {
      userName: data.userName,
      mentionedBy: data.mentionedBy,
      content: data.content.substring(0, 100) + '...',
      taskName: data.taskName,
      projectName: data.projectName,
      postType: data.postType,
      taskStreamUrl: data.taskStreamUrl
    });
    
    // Return success for testing
    return { id: 'test-mention-notification-' + Date.now() };
  }

  try {
    // Log the attempt for debugging
    console.log('📧 Attempting to send mention notification email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `You were mentioned in ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mention Notification</title>
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
              background: linear-gradient(135deg, ${getPrimaryColor()} 0%, ${getSecondaryColor()} 100%); 
              padding: 32px 24px; 
              text-align: center; 
              color: white; 
            }
            
            .logo { 
              max-width: 120px; 
              height: auto; 
              margin-bottom: 16px; 
            }
            
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              font-weight: 600; 
              color: white; 
            }
            
            .content { 
              padding: 32px 24px; 
            }
            
            .mention-highlight { 
              background-color: #FEF3C7; 
              border-left: 4px solid #F59E0B; 
              padding: 16px; 
              margin: 20px 0; 
              border-radius: 8px; 
            }
            
            .content-preview { 
              background-color: #F9FAFB; 
              border: 1px solid #E5E7EB; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 16px 0; 
              font-style: italic; 
              color: #6B7280; 
            }
            
            .button { 
              display: inline-block; 
              background-color: ${getPrimaryColor()}; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600; 
              margin: 20px 0; 
              transition: background-color 0.2s; 
            }
            
            .button:hover { 
              background-color: ${getSecondaryColor()}; 
            }
            
            .footer { 
              background-color: #F9FAFB; 
              padding: 24px; 
              text-align: center; 
              color: #6B7280; 
              font-size: 14px; 
              border-top: 1px solid #E5E7EB; 
            }
            
            .task-info { 
              background-color: #F3F4F6; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 16px 0; 
            }
            
            .task-info h3 { 
              margin: 0 0 8px 0; 
              color: #1F2937; 
              font-size: 16px; 
            }
            
            .task-info p { 
              margin: 4px 0; 
              color: #6B7280; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${getLogoUrl()}" alt="Times10 Trackr" class="logo">
              <h1>You were mentioned!</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              <p><strong>${data.mentionedBy}</strong> mentioned you in a ${data.postType} on the task <strong>"${data.taskName}"</strong>.</p>
              
              <div class="mention-highlight">
                <strong>💬 Mentioned in:</strong> ${data.taskName}<br>
                <strong>👤 By:</strong> ${data.mentionedBy}<br>
                <strong>📝 Type:</strong> ${data.postType}
              </div>
              
              <div class="task-info">
                <h3>📋 Task Details</h3>
                <p><strong>Task:</strong> ${data.taskName}</p>
                <p><strong>Project:</strong> ${data.projectName}</p>
                <p><strong>Mentioned by:</strong> ${data.mentionedBy}</p>
              </div>
              
              <div class="content-preview">
                <strong>Message preview:</strong><br>
                "${data.content.length > 200 ? data.content.substring(0, 200) + '...' : data.content}"
              </div>
              
              <p>Click the button below to view the full conversation and respond:</p>
              
              <a href="${data.taskStreamUrl}" class="button">View Task Stream</a>
              
              <p style="margin-top: 24px; color: #6B7280; font-size: 14px;">
                This notification was sent because you were mentioned in a task discussion. 
                You can reply directly in the task stream to continue the conversation.
              </p>
            </div>
            
            <div class="footer">
              <p>This email was sent from Times10 Trackr</p>
              <p>If you no longer want to receive these notifications, please contact your team administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send mention notification email: ${error.message}`);
    }

    console.log('📧 Mention notification email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending mention notification email:', error);
    throw new Error(`Failed to send mention notification email: ${(error as any).message || 'Unknown error'}`);
  }
} 