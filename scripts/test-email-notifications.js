#!/usr/bin/env node

/**
 * Local Email Notification Testing Script
 * 
 * This script helps you test all email notifications locally.
 * Make sure MailDev is running before using this script.
 * 
 * Usage:
 * 1. Start MailDev: ./start-email-debug.sh
 * 2. Start your app: npm run dev
 * 3. Run this script: node scripts/test-email-notifications.js
 */

import https from 'https';
import http from 'http';

// Configuration
const BASE_URL = 'http://localhost:4321';
const MAILDEV_URL = 'http://localhost:1080';

console.log('🧪 Email Notification Testing Script');
console.log('=====================================');
console.log('');

// Test functions
async function testEndpoint(endpoint, description) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing: ${description}`);
    console.log(`📡 Endpoint: ${BASE_URL}${endpoint}`);
    
    const isHttps = BASE_URL.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Email-Test-Script/1.0'
      }
    };
    
    const req = client.request(`${BASE_URL}${endpoint}`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log(`✅ Success: ${response.message || 'OK'}`);
            if (response.data) {
              console.log(`📊 Data:`, response.data);
            }
          } else {
            console.log(`❌ Failed: ${response.error || 'Unknown error'}`);
          }
        } catch (parseError) {
          console.log(`❌ Parse Error: ${parseError.message}`);
          console.log(`📝 Raw response: ${data.substring(0, 200)}...`);
        }
        console.log('');
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Request Error: ${error.message}`);
      console.log('');
      resolve();
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ Timeout: Request took too long`);
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

async function testScheduledNotifications() {
  console.log('📅 Testing Scheduled Notifications');
  console.log('-----------------------------------');
  
  await testEndpoint('/api/scheduled-notifications', 'Scheduled Notifications Check');
  
  console.log('💡 Note: If no tasks are found, this is normal for a fresh database.');
  console.log('   You can create test tasks with due dates to see notifications.');
  console.log('');
}

async function testDebugEmails() {
  console.log('📧 Testing Debug Email System');
  console.log('-----------------------------');
  
  // Test with a simple email type first
  const testEmail = 'test@example.com';
  
  console.log(`📨 Sending test email to: ${testEmail}`);
  console.log('📡 Endpoint: POST /api/debug-emails');
  
  const postData = JSON.stringify({
    email: testEmail,
    testType: 'collaboration' // Start with one type to avoid rate limits
  });
  
  const isHttps = BASE_URL.startsWith('https://');
  const client = isHttps ? https : http;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Email-Test-Script/1.0'
    }
  };
  
  const req = client.request(`${BASE_URL}/api/debug-emails`, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success) {
          console.log(`✅ Debug email sent successfully`);
          console.log(`📊 Response:`, response);
        } else {
          console.log(`❌ Debug email failed: ${response.error}`);
          if (response.details) {
            console.log(`📝 Details: ${response.details}`);
          }
        }
      } catch (parseError) {
        console.log(`❌ Parse Error: ${parseError.message}`);
        console.log(`📝 Raw response: ${data.substring(0, 200)}...`);
      }
      console.log('');
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ Request Error: ${error.message}`);
    console.log('');
  });
  
  req.write(postData);
  req.end();
}

async function showInstructions() {
  console.log('📋 Testing Instructions');
  console.log('======================');
  console.log('');
  console.log('1. 🌐 MailDev Web Interface:');
  console.log(`   Open: ${MAILDEV_URL}`);
  console.log('   - View all captured emails');
  console.log('   - Inspect HTML and text content');
  console.log('   - View email headers');
  console.log('');
  console.log('2. 🧪 Manual Testing:');
  console.log(`   Web Interface: ${BASE_URL}/email-debug`);
  console.log('   - Enter test email address');
  console.log('   - Select email types to test');
  console.log('   - Click "Send Test Emails"');
  console.log('');
  console.log('3. 🔧 API Testing:');
  console.log('   curl -X GET http://localhost:4321/api/scheduled-notifications');
  console.log('   curl -X POST http://localhost:4321/api/debug-emails \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email": "test@example.com", "testType": "collaboration"}\'');
  console.log('');
  console.log('4. 📊 Available Email Types:');
  console.log('   - collaboration: Collaboration assignment');
  console.log('   - task: Task assignment');
  console.log('   - subtask: Subtask assignment');
  console.log('   - mention: Mention notifications');
  console.log('   - due-soon: Due date reminders');
  console.log('   - completion: Task completion');
  console.log('   - insight: New insight notifications');
  console.log('   - all: Test all types (may hit rate limits)');
  console.log('');
}

// Main execution
async function main() {
  console.log('🚀 Starting Email Notification Tests...');
  console.log('');
  
  // Check if services are running
  console.log('🔍 Checking if services are running...');
  console.log(`📱 App URL: ${BASE_URL}`);
  console.log(`📧 MailDev URL: ${MAILDEV_URL}`);
  console.log('');
  
  // Test scheduled notifications
  await testScheduledNotifications();
  
  // Test debug emails
  await testDebugEmails();
  
  // Show instructions
  await showInstructions();
  
  console.log('✅ Testing completed!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Check MailDev interface for captured emails');
  console.log('2. Use the web interface for comprehensive testing');
  console.log('3. Create test data in your app to trigger real notifications');
  console.log('');
}

// Run the tests
main().catch(console.error);
