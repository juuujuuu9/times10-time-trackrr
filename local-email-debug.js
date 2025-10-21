#!/usr/bin/env node

/**
 * Local Email Debug Server
 * 
 * This script sets up a local email debugging environment using MailDev
 * to test emails without needing Vercel or external email services.
 * 
 * Usage:
 *   node local-email-debug.js
 * 
 * Then visit http://localhost:1080 to see captured emails
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Local Email Debug Server...');
console.log('📧 MailDev will capture all emails sent by the application');
console.log('🌐 Web interface: http://localhost:1080');
console.log('📨 SMTP server: localhost:1025');
console.log('');

// Set environment variables for local email debugging
process.env.RESEND_API_KEY = 'local-debug-mode';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.EMAIL_DEBUG_MODE = 'true';

// Start MailDev
const maildev = spawn('npx', ['maildev', '--web', '1080', '--smtp', '1025'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down email debug server...');
  maildev.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down email debug server...');
  maildev.kill();
  process.exit(0);
});

console.log('✅ Email debug server started successfully!');
console.log('💡 Now start your Astro app with: npm run dev');
console.log('📧 All emails will be captured and viewable at http://localhost:1080');
