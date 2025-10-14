#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Helps set up missing environment variables for production
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Production Environment Setup');
console.log('=====================================');

console.log('\n📋 Current Environment Variables:');
const requiredVars = [
  'DATABASE_URL',
  'RESEND_API_KEY', 
  'BASE_URL',
  'PUBLIC_SITE_URL',
  'SLACK_SIGNING_SECRET',
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET'
];

let missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️  Missing ${missingVars.length} environment variables:`);
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n🔧 To fix this, you need to set these in your Vercel dashboard:');
  console.log('1. Go to your Vercel project dashboard');
  console.log('2. Go to Settings > Environment Variables');
  console.log('3. Add the missing variables:');
  
  missingVars.forEach(varName => {
    let description = '';
    let example = '';
    
    switch(varName) {
      case 'RESEND_API_KEY':
        description = 'Email service API key for sending invitations';
        example = 're_1234567890abcdef';
        break;
      case 'BASE_URL':
        description = 'Base URL of your application';
        example = 'https://your-app.vercel.app';
        break;
      case 'PUBLIC_SITE_URL':
        description = 'Public site URL for frontend';
        example = 'https://your-app.vercel.app';
        break;
      case 'SLACK_SIGNING_SECRET':
        description = 'Slack app signing secret';
        example = 'your_slack_signing_secret';
        break;
      case 'SLACK_CLIENT_ID':
        description = 'Slack app client ID';
        example = '1234567890.1234567890';
        break;
      case 'SLACK_CLIENT_SECRET':
        description = 'Slack app client secret';
        example = 'your_slack_client_secret';
        break;
    }
    
    console.log(`\n   ${varName}:`);
    console.log(`   Description: ${description}`);
    console.log(`   Example: ${example}`);
  });
  
  console.log('\n🚀 After setting these variables:');
  console.log('1. Redeploy your application');
  console.log('2. Test the client creation again');
  
} else {
  console.log('\n🎉 All environment variables are set!');
  console.log('✅ Your application should work properly in production.');
}

console.log('\n💡 Quick Test:');
console.log('After setting the variables, you can test with:');
console.log('curl -X POST https://your-app.vercel.app/api/admin/clients \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"name":"Test Client","projectName":"Test Project"}\'');
