import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { sql } from 'drizzle-orm';
import { requireRole } from '../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    // Require admin role
    const currentUser = await requireRole(context, 'admin', '/admin') as any;
    
    console.log('🔄 Applying system fields migration...');

    // Add is_system column to projects table
    console.log('📁 Adding is_system column to projects table...');
    await db.execute(sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false NOT NULL`);
    console.log('✅ Added is_system column to projects table');

    // Add is_system column to tasks table
    console.log('📋 Adding is_system column to tasks table...');
    await db.execute(sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false NOT NULL`);
    console.log('✅ Added is_system column to tasks table');

    console.log('🎉 Migration completed successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'System fields migration applied successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
