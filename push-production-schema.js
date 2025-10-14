#!/usr/bin/env node

/**
 * Push Production Schema Script
 * Uses drizzle-kit to push schema to production database
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!PRODUCTION_DATABASE_URL) {
  console.error('❌ PRODUCTION_DATABASE_URL environment variable is required');
  console.error('Please set PRODUCTION_DATABASE_URL to your production database connection string');
  process.exit(1);
}

console.log('🚀 Pushing Schema to Production');
console.log('=====================================');
console.log(`📡 Target: ${PRODUCTION_DATABASE_URL.substring(0, 30)}...`);

try {
  // Set the production database URL
  process.env.DATABASE_URL = PRODUCTION_DATABASE_URL;
  
  console.log('⏳ Running drizzle-kit push...');
  
  // Run drizzle-kit push
  execSync('npx drizzle-kit push --force', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: PRODUCTION_DATABASE_URL
    }
  });
  
  console.log('✅ Schema pushed successfully!');
  console.log('🎯 Your task stream should now work in production!');
  
} catch (error) {
  console.error('❌ Schema push failed:', error.message);
  process.exit(1);
}
