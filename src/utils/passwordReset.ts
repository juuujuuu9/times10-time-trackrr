import { db } from '../db';
import { passwordResetTokens, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateToken } from './auth';

// Create a password reset token
export async function createPasswordResetToken(userId: number): Promise<string> {
  // First, invalidate any existing tokens for this user
  await db.update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.userId, userId));

  // Generate new token
  const token = generateToken();
  
  // Set expiration to 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Insert new token
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

// Validate a password reset token
export async function validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: number; error?: string }> {
  try {
    const result = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { valid: false, error: 'Invalid or expired password reset token' };
    }

    const resetToken = result[0];

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return { valid: false, error: 'Password reset token has expired' };
    }

    return { valid: true, userId: resetToken.userId };
  } catch (error) {
    console.error('Error validating password reset token:', error);
    return { valid: false, error: 'Error validating password reset token' };
  }
}

// Mark a password reset token as used
export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  await db.update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.token, token));
}

// Get user by email for password reset
export async function getUserByEmail(email: string): Promise<{ id: number; name: string; email: string } | null> {
  try {
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}
