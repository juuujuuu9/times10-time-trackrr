#!/usr/bin/env node

// Debug script to test subtask email functionality
console.log('🔍 Debugging Subtask Email Issues\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PUBLIC_SITE_URL:', process.env.PUBLIC_SITE_URL || 'NOT SET');
console.log('BASE_URL:', process.env.BASE_URL || 'NOT SET');

console.log('\n📧 Email Configuration Status:');
if (!process.env.RESEND_API_KEY) {
  console.log('❌ RESEND_API_KEY is not set - emails will not be sent');
  console.log('   To fix: Set RESEND_API_KEY=re_your_api_key_here');
} else if (process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
  console.log('❌ RESEND_API_KEY is set to placeholder value - emails will not be sent');
  console.log('   To fix: Set RESEND_API_KEY to your actual Resend API key');
} else {
  console.log('✅ RESEND_API_KEY is configured');
}

console.log('\n🔧 Email Triggers:');
console.log('1. Subtask Creation with Assignees: ✅ Implemented');
console.log('2. Subtask Assignment After Creation: ✅ Implemented');
console.log('3. Task Assignment: ✅ Implemented');
console.log('4. Collaboration Assignment: ✅ Implemented');

console.log('\n📝 Next Steps:');
console.log('1. Get a Resend API key from https://resend.com');
console.log('2. Set RESEND_API_KEY environment variable');
console.log('3. Test email functionality');
console.log('4. Create subtasks with assignees to test');

console.log('\n🧪 Test Commands:');
console.log('curl -X POST http://localhost:4321/api/test-notifications \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"testType": "subtask", "email": "your-email@example.com"}\'');
