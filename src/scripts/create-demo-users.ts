import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../utils/auth';

async function createDemoUsers() {
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

    for (const userData of demoUsers) {
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.email)
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
          .where((users, { eq }) => eq(users.email, userData.email));
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
      }
    }

    console.log('Demo users created successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin@times10.com / admin123');
    console.log('Manager: manager@times10.com / manager123');
    console.log('User: user@times10.com / user123');

  } catch (error) {
    console.error('Error creating demo users:', error);
  } finally {
    process.exit(0);
  }
}

createDemoUsers(); 