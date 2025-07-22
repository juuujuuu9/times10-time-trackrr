import { db } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';

// Get all active users
export async function getActiveUsers() {
  return await db
    .select()
    .from(users)
    .where(eq(users.status, 'active'))
    .orderBy(users.name);
}

// Get all users (active and inactive)
export async function getAllUsers() {
  return await db
    .select()
    .from(users)
    .orderBy(users.name);
} 