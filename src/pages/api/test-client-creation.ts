import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { clients, users } from '../../db/schema';
import { getSessionUser } from '../../utils/session';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Test 1: Check authentication
    const user = await getSessionUser({ cookies } as any);
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication failed', 
        test: 'auth',
        details: 'No authenticated user found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Test 2: Check database connectivity
    try {
      const userCount = await db.select().from(users).limit(1);
      console.log('Database connection test successful');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Database connection failed', 
        test: 'database',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Test 3: Check clients table structure
    try {
      const clientCount = await db.select().from(clients).limit(1);
      console.log('Clients table access test successful');
    } catch (tableError) {
      console.error('Clients table access test failed:', tableError);
      return new Response(JSON.stringify({ 
        error: 'Clients table access failed', 
        test: 'table',
        details: tableError instanceof Error ? tableError.message : 'Unknown table error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Test 4: Try to create a test client
    try {
      const testClient = await db.insert(clients).values({
        name: `Test Client ${Date.now()}`,
        createdBy: user.id,
      }).returning();
      
      console.log('Test client created successfully:', testClient[0]);
      
      // Clean up: delete the test client
      await db.delete(clients).where(eq(clients.id, testClient[0].id));
      console.log('Test client cleaned up');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All tests passed',
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        tests: ['auth', 'database', 'table', 'create']
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } catch (createError) {
      console.error('Client creation test failed:', createError);
      return new Response(JSON.stringify({ 
        error: 'Client creation test failed', 
        test: 'create',
        details: createError instanceof Error ? createError.message : 'Unknown creation error',
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('General test error:', error);
    return new Response(JSON.stringify({ 
      error: 'General test error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
