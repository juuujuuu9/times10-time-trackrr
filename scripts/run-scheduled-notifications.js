#!/usr/bin/env node

/**
 * Scheduled Notifications Runner
 * 
 * This script can be run via cron to send due soon and overdue notifications.
 * 
 * Usage:
 * - Manual run: node scripts/run-scheduled-notifications.js
 * - Cron job: 0 9 * * * node /path/to/scripts/run-scheduled-notifications.js
 * 
 * The cron example above runs daily at 9 AM.
 */

const https = require('https');
const http = require('http');

// Get the base URL from environment or use localhost for development
const baseUrl = process.env.APP_URL || 'http://localhost:4321';
const apiEndpoint = `${baseUrl}/api/scheduled-notifications`;

console.log('🔔 Starting scheduled notifications check...');
console.log('📡 Calling API endpoint:', apiEndpoint);

// Determine if we should use HTTPS or HTTP
const isHttps = baseUrl.startsWith('https://');
const client = isHttps ? https : http;

const options = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Scheduled-Notifications-Runner/1.0'
  }
};

const req = client.request(apiEndpoint, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ Scheduled notifications completed successfully');
        console.log('📊 Results:', {
          dueSoonTasks: response.data.dueSoonTasks,
          overdueTasks: response.data.overdueTasks,
          dueSoonNotificationsSent: response.data.dueSoonNotificationsSent,
          overdueNotificationsSent: response.data.overdueNotificationsSent,
          checkedAt: response.data.checkedAt
        });
        
        // Exit with success code
        process.exit(0);
      } else {
        console.error('❌ Scheduled notifications failed:', response.error);
        console.error('📝 Details:', response.details);
        process.exit(1);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse API response:', parseError);
      console.error('📝 Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('🔧 Check that the application is running and accessible at:', baseUrl);
  process.exit(1);
});

// Set timeout to prevent hanging
req.setTimeout(30000, () => {
  console.error('❌ Request timed out after 30 seconds');
  req.destroy();
  process.exit(1);
});

req.end();
