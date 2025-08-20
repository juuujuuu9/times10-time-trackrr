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
  try {
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

    // Log the attempt for debugging
    console.log('📧 Attempting to send invitation email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'Times10 <onboarding@resend.dev>',
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
            body { font-family: 'Istok Web', system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to Times10!</h1>
              <p>You've been invited to join our time tracking platform</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>You've been invited by <strong>${data.invitedBy}</strong> to join Times10 Time Tracker as a <strong>${data.role}</strong>.</p>
              
              <p>Times10 is a powerful time tracking platform that helps teams manage their time, projects, and productivity.</p>
              
              <div style="text-align: center;">
                <a href="${data.invitationUrl}" class="button">Set Up Your Account</a>
              </div>
              
              <p><strong>What you can do with Times10:</strong></p>
              <ul>
                <li>Track time on projects and tasks</li>
                <li>View detailed reports and analytics</li>
                <li>Collaborate with your team</li>
                <li>Manage projects and clients</li>
              </ul>
              
              <p><strong>Important:</strong> This invitation link will expire in 24 hours for security reasons.</p>
              
              <p>If you have any questions, please contact your team administrator.</p>
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
  try {
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

    // Log the attempt for debugging
    console.log('📧 Attempting to send task assignment email to:', data.email);
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'Times10 <onboarding@resend.dev>',
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
            body { font-family: 'Istok Web', system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .task-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Task Assignment</h1>
              <p>You have been assigned a new task</p>
            </div>
            <div class="content">
              <h2>Hi ${data.userName},</h2>
              <p>You have been assigned a new task by <strong>${data.assignedBy}</strong>.</p>
              
              <div class="task-card">
                <h3 style="margin-top: 0; color: #059669;">${data.taskName}</h3>
                <p><strong>Project:</strong> ${data.projectName}</p>
                ${data.taskDescription ? `<p><strong>Description:</strong> ${data.taskDescription}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Task in Dashboard</a>
              </div>
              
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>Start tracking time on this task</li>
                <li>Add notes and updates</li>
                <li>Mark the task as complete when finished</li>
                <li>View progress and time spent</li>
              </ul>
              
              <p>If you have any questions about this task, please contact ${data.assignedBy}.</p>
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