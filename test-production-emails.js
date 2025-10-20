// Test production email configuration
console.log('🔍 Testing Production Email Configuration\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PUBLIC_SITE_URL:', process.env.PUBLIC_SITE_URL || 'NOT SET');
console.log('BASE_URL:', process.env.BASE_URL || 'NOT SET');

console.log('\n📧 Email Configuration Status:');
if (!process.env.RESEND_API_KEY) {
  console.log('❌ RESEND_API_KEY is not set - emails will not be sent');
  console.log('   To fix: Set RESEND_API_KEY in Vercel dashboard');
} else if (process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
  console.log('❌ RESEND_API_KEY is set to placeholder value - emails will not be sent');
  console.log('   To fix: Set RESEND_API_KEY to your actual Resend API key');
} else {
  console.log('✅ RESEND_API_KEY is configured');
}

console.log('\n🔧 Vercel Environment Setup:');
console.log('1. Go to your Vercel dashboard');
console.log('2. Navigate to your project settings');
console.log('3. Go to "Environment Variables"');
console.log('4. Add or update RESEND_API_KEY with: re_UY1EVLJj_DpL5vb8BYJ1cr7Xbp1quwGma');
console.log('5. Make sure it\'s set for "Production" environment');
console.log('6. Redeploy your project');

console.log('\n🧪 Test Production Email:');
console.log('After setting the API key, test with:');
console.log('curl -X POST https://your-production-url.vercel.app/api/test-notifications \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"testType": "subtask", "email": "your-email@example.com"}\'');

console.log('\n📝 Expected Results:');
console.log('✅ If working: Real email ID like "ffa5bf32-28f4-48ba-91c7-c88a36a3aac9"');
console.log('❌ If not working: Test ID like "test-subtask-assignment-1760982701711"');
