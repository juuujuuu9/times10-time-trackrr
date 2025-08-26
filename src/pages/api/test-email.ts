import type { APIRoute } from 'astro';
import { sendInvitationEmail } from '../../utils/email';

export const GET: APIRoute = async () => {
  try {
    // Test email sending
    const testData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      invitationUrl: 'https://trackr.times10.net/setup-account?token=test-token',
      invitedBy: 'Test Admin'
    };

    console.log('🧪 Testing email functionality...');
    console.log('🧪 RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
    console.log('🧪 PUBLIC_SITE_URL:', process.env.PUBLIC_SITE_URL);
    console.log('🧪 BASE_URL:', process.env.BASE_URL);

    const result = await sendInvitationEmail(testData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Email test completed',
      result,
      hasApiKey: !!process.env.RESEND_API_KEY,
      publicSiteUrl: process.env.PUBLIC_SITE_URL,
      baseUrl: process.env.BASE_URL
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🧪 Email test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasApiKey: !!process.env.RESEND_API_KEY,
      publicSiteUrl: process.env.PUBLIC_SITE_URL,
      baseUrl: process.env.BASE_URL
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
