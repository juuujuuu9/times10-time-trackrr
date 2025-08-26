import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface InvitationEmailData {
  email: string;
  name: string;
  role: string;
  invitationUrl: string;
  invitedBy: string;
}

export async function sendInvitationEmail(data: InvitationEmailData) {
  // Check if we have a Resend API key configured
  if (!process.env.RESEND_API_KEY) {
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
      from: 'Times10 <noreply@trackr.times10.net>',
      to: [data.email],
      subject: `You've been invited to join Times10 Time Tracker`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Times10 Invitation</title>
          <style>
            body { font-family: 'Istok Web', system-ui, sans-serif; line-height: 1.6; color: #1F292E; background-color: #F2F2F3; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #415058 0%, #1F292E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #C8CDD0; }
            .button { display: inline-block; background: #d63a2e; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; transition: background-color 0.2s; }
            .button:hover { background: #b52a24; }
            .footer { text-align: center; margin-top: 30px; color: #415058; font-size: 14px; }
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
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

export async function sendTaskAssignmentEmail(data: TaskAssignmentEmailData) {
  // Check if we have a Resend API key configured
  if (!process.env.RESEND_API_KEY) {
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
      from: 'Times10 <noreply@trackr.times10.net>',
      to: [data.email],
      subject: `New Task Assigned: ${data.taskName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Task Assignment</title>
          <style>
            body { font-family: 'Istok Web', system-ui, sans-serif; line-height: 1.6; color: #1F292E; background-color: #F2F2F3; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #415058 0%, #1F292E 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #C8CDD0; }
            .button { display: inline-block; background: #d63a2e; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; transition: background-color 0.2s; }
            .button:hover { background: #b52a24; }
            .task-card { background: #F2F2F3; border: 1px solid #C8CDD0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #415058; font-size: 14px; }
            .highlight { color: #d63a2e; }
            .text-dark { color: #1F292E; }
            .text-mid { color: #415058; }
            .text-light { color: #C8CDD0; }
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
                <h3 style="margin-top: 0; color: #d63a2e;">${data.taskName}</h3>
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