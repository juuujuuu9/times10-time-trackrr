import type { APIRoute } from 'astro';
import { db } from '../../db';
import { users } from '../../db/schema';
import { hashPassword } from '../../utils/auth';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async () => {
  try {
    console.log('Creating demo users...');

    const demoUsers = [
      {
        email: 'admin@times10.com',
        name: 'Admin User',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        payRate: '50.00'
      },
      {
        email: 'manager@times10.com',
        name: 'Manager User',
        password: 'manager123',
        role: 'manager',
        status: 'active',
        payRate: '35.00'
      },
      {
        email: 'user@times10.com',
        name: 'Regular User',
        password: 'user123',
        role: 'user',
        status: 'active',
        payRate: '25.00'
      }
    ];

    const results = [];

    for (const userData of demoUsers) {
      try {
        // Hash the password
        const hashedPassword = await hashPassword(userData.password);
        
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, userData.email)
        });

        if (existingUser) {
          console.log(`User ${userData.email} already exists, updating...`);
          await db.update(users)
            .set({
              name: userData.name,
              password: hashedPassword,
              role: userData.role,
              status: userData.status,
              payRate: userData.payRate,
              updatedAt: new Date()
            })
            .where(eq(users.email, userData.email));
          
          results.push({ email: userData.email, status: 'updated' });
        } else {
          console.log(`Creating user ${userData.email}...`);
          await db.insert(users).values({
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: userData.role,
            status: userData.status,
            payRate: userData.payRate
          });
          
          results.push({ email: userData.email, status: 'created' });
        }
      } catch (error) {
        console.error(`Error processing user ${userData.email}:`, error);
        results.push({ email: userData.email, status: 'error', error: error.message });
      }
    }

    console.log('Demo users setup completed!');

    return new Response(JSON.stringify({
      success: true,
      message: 'Demo users created successfully!',
      results,
      credentials: {
        admin: 'admin@times10.com / admin123',
        manager: 'manager@times10.com / manager123',
        user: 'user@times10.com / user123'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating demo users:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create demo users',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 