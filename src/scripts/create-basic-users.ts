import 'dotenv/config';
import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../utils/auth';
import { eq } from 'drizzle-orm';

async function upsertUser(email: string, name: string, password: string, role: 'admin' | 'user') {
  const hashed = await hashPassword(password);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (existing) {
    await db.update(users)
      .set({
        name,
        password: hashed,
        role,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));
    console.log(`Updated user ${email}`);
    return existing.id;
  } else {
    const [inserted] = await db.insert(users).values({
      email,
      name,
      password: hashed,
      role,
      status: 'active',
      payRate: '0.00',
    }).returning();
    console.log(`Created user ${email}`);
    return inserted.id;
  }
}

async function main() {
  try {
    await upsertUser('admin@test.com', 'Admin', 'test123', 'admin');
    await upsertUser('user@test.com', 'Team Member', 'test123', 'user');
    console.log('Done.');
  } catch (err) {
    console.error('Failed to create users:', err);
    process.exit(1);
  }
}

main();


