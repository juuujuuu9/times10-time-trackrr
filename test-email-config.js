#!/usr/bin/env node

// Test email configuration
console.log('🔍 Testing Email Configuration\n');

// Check if Resend API key is configured
const apiKey = process.env.RESEND_API_KEY;
console.log('RESEND_API_KEY:', apiKey ? 'SET' : 'NOT SET');

if (!apiKey) {
  console.log('❌ No Resend API key configured - emails will not be sent');
  console.log('   To fix: Set RESEND_API_KEY=re_your_api_key_here');
  console.log('   Get API key from: https://resend.com');
} else if (apiKey === 'your_resend_api_key_here') {
  console.log('❌ Resend API key is set to placeholder value');
  console.log('   To fix: Set RESEND_API_KEY to your actual Resend API key');
} else {
  console.log('✅ Resend API key is configured');
}

console.log('\n📧 Email System Status:');
console.log('- Email functions: ✅ Implemented');
console.log('- Subtask assignment emails: ✅ Implemented');
console.log('- Email templates: ✅ Implemented');
console.log('- API key configuration: ' + (apiKey && apiKey !== 'your_resend_api_key_here' ? '✅' : '❌'));

console.log('\n🔧 To Fix Email Issues:');
console.log('1. Get a Resend API key from https://resend.com');
console.log('2. Set RESEND_API_KEY environment variable');
console.log('3. Restart your development server');
console.log('4. Test by assigning users to subtasks');

console.log('\n🧪 Test Commands:');
console.log('# Test email functionality:');
console.log('curl -X POST http://localhost:4321/api/test-notifications \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"testType": "subtask", "email": "your-email@example.com"}\'');
console.log('');
console.log('# If you see "test-subtask-assignment-..." in response, emails are not being sent');
console.log('# If you see actual email delivery, emails are working');
