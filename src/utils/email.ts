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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
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
      if ((error as any).statusCode === 403) {
        throw new Error('Email service error: Please verify your domain at resend.com/domains or check your API key configuration.');
      }
      throw new Error('Failed to send invitation email');
    }

    return emailData;
  } catch (error) {
    console.error('Error in sendInvitationEmail:', error);
    throw error;
  }
} 