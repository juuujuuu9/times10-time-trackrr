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
              color: white !important; 
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

// New email notification interfaces and functions

export interface CollaborationRemovalEmailData {
  email: string;
  userName: string;
  collaborationName: string;
  projectName: string;
  removedBy: string;
  reason?: string;
  fallbackUrl: string;
}

export interface TaskReassignmentEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  reassignedBy: string;
  reason?: string;
  previousAssignee?: string;
  dashboardUrl: string;
}

export interface DueSoonReminderEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  dueDate: string;
  daysUntilDue: number;
  dashboardUrl: string;
  snoozeUrl: string;
}

export interface OverdueNotificationEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  dueDate: string;
  daysOverdue: number;
  dashboardUrl: string;
  snoozeUrl: string;
}

export interface TaskStatusChangeEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  dashboardUrl: string;
}

export interface DueDateChangeEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  oldDueDate: string;
  newDueDate: string;
  changedBy: string;
  dashboardUrl: string;
}

export interface TaskCompletionEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  completedBy: string;
  completionDate: string;
  remainingBlockers?: string[];
  dashboardUrl: string;
}

export interface NewInsightEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  insightAuthor: string;
  insightContent: string;
  taskStreamUrl: string;
}

export interface InsightReplyEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  repliedBy: string;
  replyContent: string;
  originalInsightContent: string;
  taskStreamUrl: string;
}

export interface InsightLikedEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  likedBy: string;
  insightContent: string;
  taskStreamUrl: string;
}

export interface AttachmentAddedEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  uploadedBy: string;
  fileName: string;
  fileSize?: string;
  attachmentType: string;
  taskStreamUrl: string;
}

export interface InsightResolvedEmailData {
  email: string;
  userName: string;
  taskName: string;
  projectName: string;
  resolvedBy: string;
  resolutionSummary: string;
  originalInsightContent: string;
  taskStreamUrl: string;
}

export async function sendCollaborationRemovalEmail(data: CollaborationRemovalEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Collaboration removal notification would be sent to:', data.email);
    console.log('📧 Removal Details:', {
      userName: data.userName,
      collaborationName: data.collaborationName,
      projectName: data.projectName,
      removedBy: data.removedBy,
      reason: data.reason,
      fallbackUrl: data.fallbackUrl
    });
    return { id: 'test-collaboration-removal-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send collaboration removal email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Access removed from ${data.collaborationName} collaboration`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Removed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0 0 10px 0;">Access Removed from Collaboration</h2>
              <p style="color: #856404; margin: 0;">Your access to the <strong>${data.collaborationName}</strong> collaboration has been removed.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Details</h3>
              <p><strong>Collaboration:</strong> ${data.collaborationName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Removed by:</strong> ${data.removedBy}</p>
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.fallbackUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Dashboard
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>If you believe this was done in error, please contact your team administrator or the person who removed your access.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send collaboration removal email: ${error.message}`);
    }

    console.log('📧 Collaboration removal email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending collaboration removal email:', error);
    throw new Error(`Failed to send collaboration removal email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendTaskReassignmentEmail(data: TaskReassignmentEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Task reassignment notification would be sent to:', data.email);
    console.log('📧 Reassignment Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      reassignedBy: data.reassignedBy,
      reason: data.reason,
      previousAssignee: data.previousAssignee,
      dashboardUrl: data.dashboardUrl
    });
    return { id: 'test-task-reassignment-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send task reassignment email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Task reassigned: ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Reassigned</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #0066cc; margin: 0 0 10px 0;">Task Reassigned</h2>
              <p style="color: #0066cc; margin: 0;">The task <strong>${data.taskName}</strong> has been reassigned.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Assignment Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Reassigned by:</strong> ${data.reassignedBy}</p>
              ${data.previousAssignee ? `<p><strong>Previous assignee:</strong> ${data.previousAssignee}</p>` : ''}
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Task
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>If you have any questions about this reassignment, please contact ${data.reassignedBy} or your team administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send task reassignment email: ${error.message}`);
    }

    console.log('📧 Task reassignment email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending task reassignment email:', error);
    throw new Error(`Failed to send task reassignment email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendDueSoonReminderEmail(data: DueSoonReminderEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Due soon reminder would be sent to:', data.email);
    console.log('📧 Due Soon Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      dueDate: data.dueDate,
      daysUntilDue: data.daysUntilDue,
      dashboardUrl: data.dashboardUrl,
      snoozeUrl: data.snoozeUrl
    });
    return { id: 'test-due-soon-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send due soon reminder email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Reminder: ${data.taskName} due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? '' : 's'}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Due Soon Reminder</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0 0 10px 0;">⏰ Due Soon Reminder</h2>
              <p style="color: #856404; margin: 0;">Your task <strong>${data.taskName}</strong> is due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? '' : 's'}.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Task Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p><strong>Time Remaining:</strong> ${data.daysUntilDue} day${data.daysUntilDue === 1 ? '' : 's'}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                View Task
              </a>
              <a href="${data.snoozeUrl}" style="background-color: ${getSecondaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Snooze Reminder
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>You can snooze this reminder for 24 hours if you need more time to prepare.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send due soon reminder email: ${error.message}`);
    }

    console.log('📧 Due soon reminder email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending due soon reminder email:', error);
    throw new Error(`Failed to send due soon reminder email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendOverdueNotificationEmail(data: OverdueNotificationEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Overdue notification would be sent to:', data.email);
    console.log('📧 Overdue Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      dueDate: data.dueDate,
      daysOverdue: data.daysOverdue,
      dashboardUrl: data.dashboardUrl,
      snoozeUrl: data.snoozeUrl
    });
    return { id: 'test-overdue-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send overdue notification email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `URGENT: ${data.taskName} is ${data.daysOverdue} day${data.daysOverdue === 1 ? '' : 's'} overdue`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Overdue Task</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #721c24; margin: 0 0 10px 0;">🚨 OVERDUE TASK</h2>
              <p style="color: #721c24; margin: 0;">Your task <strong>${data.taskName}</strong> is ${data.daysOverdue} day${data.daysOverdue === 1 ? '' : 's'} overdue.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Task Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Original Due Date:</strong> ${data.dueDate}</p>
              <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                Complete Task
              </a>
              <a href="${data.snoozeUrl}" style="background-color: ${getSecondaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Snooze Reminder
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p><strong>Action Required:</strong> Please complete this task as soon as possible or contact your team if you need assistance.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send overdue notification email: ${error.message}`);
    }

    console.log('📧 Overdue notification email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending overdue notification email:', error);
    throw new Error(`Failed to send overdue notification email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendTaskStatusChangeEmail(data: TaskStatusChangeEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Task status change notification would be sent to:', data.email);
    console.log('📧 Status Change Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      changedBy: data.changedBy,
      dashboardUrl: data.dashboardUrl
    });
    return { id: 'test-status-change-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send task status change email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Status changed: ${data.taskName} (${data.oldStatus} → ${data.newStatus})`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Status Changed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #0066cc; margin: 0 0 10px 0;">📋 Status Update</h2>
              <p style="color: #0066cc; margin: 0;">The status of <strong>${data.taskName}</strong> has been updated.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Status Change</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Previous Status:</strong> <span style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${data.oldStatus}</span></p>
              <p><strong>New Status:</strong> <span style="background-color: #d4edda; padding: 4px 8px; border-radius: 4px; color: #155724;">${data.newStatus}</span></p>
              <p><strong>Changed by:</strong> ${data.changedBy}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Task
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>This status change may affect your workflow. Please review the task and update your plans accordingly.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send task status change email: ${error.message}`);
    }

    console.log('📧 Task status change email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending task status change email:', error);
    throw new Error(`Failed to send task status change email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendDueDateChangeEmail(data: DueDateChangeEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Due date change notification would be sent to:', data.email);
    console.log('📧 Due Date Change Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      oldDueDate: data.oldDueDate,
      newDueDate: data.newDueDate,
      changedBy: data.changedBy,
      dashboardUrl: data.dashboardUrl
    });
    return { id: 'test-due-date-change-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send due date change email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Due date changed: ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Due Date Changed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0 0 10px 0;">📅 Due Date Updated</h2>
              <p style="color: #856404; margin: 0;">The due date for <strong>${data.taskName}</strong> has been changed.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Date Change Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Previous Due Date:</strong> <span style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${data.oldDueDate}</span></p>
              <p><strong>New Due Date:</strong> <span style="background-color: #d4edda; padding: 4px 8px; border-radius: 4px; color: #155724;">${data.newDueDate}</span></p>
              <p><strong>Changed by:</strong> ${data.changedBy}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Task
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>Please update your schedule and priorities based on this new due date.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send due date change email: ${error.message}`);
    }

    console.log('📧 Due date change email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending due date change email:', error);
    throw new Error(`Failed to send due date change email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendTaskCompletionEmail(data: TaskCompletionEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Task completion notification would be sent to:', data.email);
    console.log('📧 Completion Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      completedBy: data.completedBy,
      completionDate: data.completionDate,
      remainingBlockers: data.remainingBlockers,
      dashboardUrl: data.dashboardUrl
    });
    return { id: 'test-task-completion-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send task completion email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `✅ Task completed: ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Completed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #155724; margin: 0 0 10px 0;">🎉 Task Completed!</h2>
              <p style="color: #155724; margin: 0;">The task <strong>${data.taskName}</strong> has been marked as completed.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Completion Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Completed by:</strong> ${data.completedBy}</p>
              <p><strong>Completion Date:</strong> ${data.completionDate}</p>
            </div>

            ${data.remainingBlockers && data.remainingBlockers.length > 0 ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Remaining Blockers</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                ${data.remainingBlockers.map(blocker => `<li>${blocker}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Project
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>Great work! ${data.remainingBlockers && data.remainingBlockers.length > 0 ? 'Please address any remaining blockers to fully complete this task.' : 'This task is now complete and ready for review.'}</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send task completion email: ${error.message}`);
    }

    console.log('📧 Task completion email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending task completion email:', error);
    throw new Error(`Failed to send task completion email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendNewInsightEmail(data: NewInsightEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: New insight notification would be sent to:', data.email);
    console.log('📧 New Insight Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      insightAuthor: data.insightAuthor,
      insightContent: data.insightContent.substring(0, 100) + '...',
      taskStreamUrl: data.taskStreamUrl
    });
    return { id: 'test-new-insight-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send new insight email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `New insight on ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Insight</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #0066cc; margin: 0 0 10px 0;">💡 New Insight</h2>
              <p style="color: #0066cc; margin: 0;">A new insight has been added to <strong>${data.taskName}</strong>.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Insight Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Author:</strong> ${data.insightAuthor}</p>
            </div>

            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <h4 style="color: #333; margin: 0 0 10px 0;">Insight Content</h4>
              <div style="color: #666; line-height: 1.5;">${data.insightContent}</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.taskStreamUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Insight
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>You're receiving this because you're following this task. You can unfollow the task to stop receiving these notifications.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send new insight email: ${error.message}`);
    }

    console.log('📧 New insight email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending new insight email:', error);
    throw new Error(`Failed to send new insight email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendInsightReplyEmail(data: InsightReplyEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Insight reply notification would be sent to:', data.email);
    console.log('📧 Insight Reply Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      repliedBy: data.repliedBy,
      replyContent: data.replyContent.substring(0, 100) + '...',
      originalInsightContent: data.originalInsightContent.substring(0, 100) + '...',
      taskStreamUrl: data.taskStreamUrl
    });
    return { id: 'test-insight-reply-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send insight reply email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Reply to your insight on ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Insight Reply</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #856404; margin: 0 0 10px 0;">💬 Reply to Your Insight</h2>
              <p style="color: #856404; margin: 0;">Someone replied to your insight on <strong>${data.taskName}</strong>.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Reply Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Replied by:</strong> ${data.repliedBy}</p>
            </div>

            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <h4 style="color: #333; margin: 0 0 10px 0;">Your Original Insight</h4>
              <div style="color: #666; line-height: 1.5; margin-bottom: 15px;">${data.originalInsightContent}</div>
              
              <h4 style="color: #333; margin: 0 0 10px 0;">New Reply</h4>
              <div style="color: #333; line-height: 1.5; background-color: #e7f3ff; padding: 10px; border-radius: 4px;">${data.replyContent}</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.taskStreamUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Conversation
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>You're receiving this because someone replied to your insight. You can manage your notification preferences in your account settings.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send insight reply email: ${error.message}`);
    }

    console.log('📧 Insight reply email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending insight reply email:', error);
    throw new Error(`Failed to send insight reply email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendInsightLikedEmail(data: InsightLikedEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Insight liked notification would be sent to:', data.email);
    console.log('📧 Insight Liked Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      likedBy: data.likedBy,
      insightContent: data.insightContent.substring(0, 100) + '...',
      taskStreamUrl: data.taskStreamUrl
    });
    return { id: 'test-insight-liked-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send insight liked email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Your insight on ${data.taskName} was liked`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Insight Liked</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #155724; margin: 0 0 10px 0;">👍 Insight Liked</h2>
              <p style="color: #155724; margin: 0;">Your insight on <strong>${data.taskName}</strong> received a like!</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Like Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Liked by:</strong> ${data.likedBy}</p>
            </div>

            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <h4 style="color: #333; margin: 0 0 10px 0;">Your Insight</h4>
              <div style="color: #666; line-height: 1.5;">${data.insightContent}</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.taskStreamUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Insight
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>Great insight! Keep sharing your thoughts to help the team move forward.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send insight liked email: ${error.message}`);
    }

    console.log('📧 Insight liked email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending insight liked email:', error);
    throw new Error(`Failed to send insight liked email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendAttachmentAddedEmail(data: AttachmentAddedEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Attachment added notification would be sent to:', data.email);
    console.log('📧 Attachment Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      uploadedBy: data.uploadedBy,
      fileName: data.fileName,
      fileSize: data.fileSize,
      attachmentType: data.attachmentType,
      taskStreamUrl: data.taskStreamUrl
    });
    return { id: 'test-attachment-added-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send attachment added email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `New attachment added to ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Attachment Added</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #0066cc; margin: 0 0 10px 0;">📎 New Attachment</h2>
              <p style="color: #0066cc; margin: 0;">A new ${data.attachmentType} has been added to <strong>${data.taskName}</strong>.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Attachment Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>File:</strong> ${data.fileName}</p>
              <p><strong>Type:</strong> ${data.attachmentType}</p>
              ${data.fileSize ? `<p><strong>Size:</strong> ${data.fileSize}</p>` : ''}
              <p><strong>Uploaded by:</strong> ${data.uploadedBy}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.taskStreamUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Attachment
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>This attachment may require your review or action. Please check the task for more details.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send attachment added email: ${error.message}`);
    }

    console.log('📧 Attachment added email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending attachment added email:', error);
    throw new Error(`Failed to send attachment added email: ${(error as any).message || 'Unknown error'}`);
  }
}

export async function sendInsightResolvedEmail(data: InsightResolvedEmailData) {
  const resend = getResendClient();
  if (!resend) {
    console.log('📧 NO API KEY: Insight resolved notification would be sent to:', data.email);
    console.log('📧 Insight Resolved Details:', {
      userName: data.userName,
      taskName: data.taskName,
      projectName: data.projectName,
      resolvedBy: data.resolvedBy,
      resolutionSummary: data.resolutionSummary,
      originalInsightContent: data.originalInsightContent.substring(0, 100) + '...',
      taskStreamUrl: data.taskStreamUrl
    });
    return { id: 'test-insight-resolved-' + Date.now() };
  }

  try {
    console.log('📧 Attempting to send insight resolved email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: getSenderString(),
      replyTo: getReplyToString(),
      to: [data.email],
      subject: `Insight resolved: ${data.taskName}`,
      headers: getEmailHeaders(),
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Insight Resolved</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${getLogoUrl()}" alt="Times10 Logo" style="max-width: 200px; height: auto;">
            </div>
            
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #155724; margin: 0 0 10px 0;">✅ Insight Resolved</h2>
              <p style="color: #155724; margin: 0;">An insight on <strong>${data.taskName}</strong> has been resolved.</p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Resolution Details</h3>
              <p><strong>Task:</strong> ${data.taskName}</p>
              <p><strong>Project:</strong> ${data.projectName}</p>
              <p><strong>Resolved by:</strong> ${data.resolvedBy}</p>
            </div>

            <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <h4 style="color: #333; margin: 0 0 10px 0;">Original Insight</h4>
              <div style="color: #666; line-height: 1.5; margin-bottom: 15px;">${data.originalInsightContent}</div>
              
              <h4 style="color: #333; margin: 0 0 10px 0;">Resolution Summary</h4>
              <div style="color: #155724; line-height: 1.5; background-color: #d4edda; padding: 10px; border-radius: 4px;">${data.resolutionSummary}</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.taskStreamUrl}" style="background-color: ${getPrimaryColor()}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Resolution
              </a>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px;">
              <p>This insight thread has been closed. You can still view the conversation and resolution details.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send insight resolved email: ${error.message}`);
    }

    console.log('📧 Insight resolved email sent successfully:', emailData);
    return emailData;
  } catch (error) {
    console.error('Error sending insight resolved email:', error);
    throw new Error(`Failed to send insight resolved email: ${(error as any).message || 'Unknown error'}`);
  }
} 