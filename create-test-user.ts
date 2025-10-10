import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { hashPassword } from './src/utils/auth.ts';

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Hash the password
    const hashedPassword = await hashPassword('password123');
    
    // Create test user
    const testUser = await db.insert(users).values({
      email: 'admin@test.com',
      name: 'Test Admin',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      payRate: '50.00'
    }).returning();
    
    console.log('Test user created successfully:', {
      id: testUser[0].id,
      email: testUser[0].email,
      name: testUser[0].name,
      role: testUser[0].role
    });
    
    console.log('\nYou can now log in with:');
    console.log('Email: admin@test.com');
    console.log('Password: password123');
    
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('Test user already exists!');
      console.log('\nYou can log in with:');
      console.log('Email: admin@test.com');
      console.log('Password: password123');
    } else {
      console.error('Error creating test user:', error);
    }
  }
}

createTestUser();
