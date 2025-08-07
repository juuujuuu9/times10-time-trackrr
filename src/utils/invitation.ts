import { randomBytes } from 'crypto';
import { db } from '../db/index';
import { invitationTokens } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';

export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createInvitationToken(email: string): Promise<string> {
  const token = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  await db.insert(invitationTokens).values({
    email,
    token,
    expiresAt,
    used: false,
  });

  return token;
}

export async function validateInvitationToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const invitation = await db
      .select()
      .from(invitationTokens)
      .where(
        and(
          eq(invitationTokens.token, token),
          eq(invitationTokens.used, false)
        )
      )
      .limit(1);

    if (invitation.length === 0) {
      return { valid: false, error: 'Invalid invitation token' };
    }

    // Check if token is expired
    if (invitation[0].expiresAt < new Date()) {
      return { valid: false, error: 'Invitation token has expired' };
    }

    return { valid: true, email: invitation[0].email };
  } catch (error) {
    console.error('Error validating invitation token:', error);
    return { valid: false, error: 'Error validating invitation token' };
  }
}

export async function markInvitationTokenAsUsed(token: string): Promise<void> {
  await db
    .update(invitationTokens)
    .set({ used: true })
    .where(eq(invitationTokens.token, token));
}

export async function cleanupExpiredTokens(): Promise<void> {
  const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  await db
    .delete(invitationTokens)
    .where(lt(invitationTokens.expiresAt, expiredDate));
} 