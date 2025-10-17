#!/usr/bin/env node

// Live debug script for subtask email issues
console.log('🔍 Live Debug: Subtask Assignment Emails\n');

console.log('📋 Steps to Debug:');
console.log('1. Open your browser developer console');
console.log('2. Go to the collaborations page');
console.log('3. Assign a user to a subtask');
console.log('4. Check the console for these logs:');

console.log('\n📝 Console Logs to Look For:');
console.log('✅ "PUT subtask API called" - API is being called');
console.log('✅ "📧 Attempting to send subtask assignment email to {email}" - Email logic triggered');
console.log('✅ "📧 Subtask assignment email sent to {email}" - Email sent successfully');
console.log('❌ "📧 Skipping email for user {name} (same user or no email)" - User lookup failed');
console.log('❌ "Error sending subtask assignment notifications:" - Email sending failed');

console.log('\n🔧 Common Issues:');
console.log('1. User not found by name - check if user.name matches exactly');
console.log('2. User has no email address - check user.email field');
console.log('3. User is the same as current user - emails not sent to self');
console.log('4. Email sending fails silently - check Resend API key');

console.log('\n🧪 Test Steps:');
console.log('1. Assign a user to a subtask');
console.log('2. Check browser console for the logs above');
console.log('3. If you see "📧 Attempting to send..." but no "📧 Subtask assignment email sent..."');
console.log('4. Check if there are any error messages');

console.log('\n📧 Email System Status:');
console.log('- Other emails working: ✅ (you confirmed this)');
console.log('- Resend API key: ✅ (configured)');
console.log('- Subtask email function: ✅ (implemented)');
console.log('- Issue: Subtask assignment emails specifically not working');

console.log('\n🔍 Debug Questions:');
console.log('1. Do you see "PUT subtask API called" in console?');
console.log('2. Do you see "📧 Attempting to send subtask assignment email"?');
console.log('3. Do you see any error messages?');
console.log('4. What user are you trying to assign?');
console.log('5. Does that user have an email address?');
