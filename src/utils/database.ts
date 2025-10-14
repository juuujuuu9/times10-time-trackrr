/**
 * Database Management Utility
 * Handles multiple database connections for different environments
 */

import { neon } from '@neondatabase/serverless';

// Database configurations
const DATABASE_CONFIGS = {
  local: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8hQj7xVaUtiZ@ep-blue-sky-123456.us-east-1.aws.neon.tech/neondb?sslmode=require',
    name: 'Local Development'
  },
  production: {
    url: 'postgres://neondb_owner:npg_DTnBFMrw5Za0@ep-jolly-art-af9o1fww-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
    name: 'Production'
  }
};

// Database connection instances
const connections = {
  local: neon(DATABASE_CONFIGS.local.url),
  production: neon(DATABASE_CONFIGS.production.url)
};

/**
 * Get database connection for specific environment
 */
export function getDatabase(environment: 'local' | 'production' = 'local') {
  return connections[environment];
}

/**
 * Get database configuration for specific environment
 */
export function getDatabaseConfig(environment: 'local' | 'production' = 'local') {
  return DATABASE_CONFIGS[environment];
}

/**
 * Test database connection
 */
export async function testConnection(environment: 'local' | 'production' = 'local') {
  try {
    const sql = getDatabase(environment);
    const result = await sql`SELECT 1 as test`;
    console.log(`✅ ${DATABASE_CONFIGS[environment].name} database connection successful`);
    return true;
  } catch (error) {
    console.error(`❌ ${DATABASE_CONFIGS[environment].name} database connection failed:`, error);
    return false;
  }
}

/**
 * Compare schemas between environments
 */
export async function compareSchemas() {
  console.log('🔍 Comparing database schemas...');
  
  try {
    // Get local schema
    const localSql = getDatabase('local');
    const localTables = await localSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    // Get production schema
    const prodSql = getDatabase('production');
    const prodTables = await prodSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📊 Schema comparison:');
    console.log(`Local tables: ${localTables.length}`);
    console.log(`Production tables: ${prodTables.length}`);
    
    const localTableNames = localTables.map(t => t.table_name);
    const prodTableNames = prodTables.map(t => t.table_name);
    
    const missingInProd = localTableNames.filter(name => !prodTableNames.includes(name));
    const missingInLocal = prodTableNames.filter(name => !localTableNames.includes(name));
    
    if (missingInProd.length > 0) {
      console.log('⚠️  Tables in local but not in production:', missingInProd);
    }
    
    if (missingInLocal.length > 0) {
      console.log('⚠️  Tables in production but not in local:', missingInLocal);
    }
    
    if (missingInProd.length === 0 && missingInLocal.length === 0) {
      console.log('✅ Schemas are in sync');
    }
    
  } catch (error) {
    console.error('❌ Error comparing schemas:', error);
  }
}

/**
 * Get environment-specific database URL
 */
export function getDatabaseUrl(environment: 'local' | 'production' = 'local') {
  return DATABASE_CONFIGS[environment].url;
}
