import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Load environment variables
let databaseUrl: string | undefined;

// Check if we're in Astro environment (import.meta.env available)
if (typeof import.meta !== 'undefined' && import.meta.env) {
  databaseUrl = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
} else {
  // Node.js environment
  databaseUrl = process.env.DATABASE_URL;
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

export * from './schema'; 