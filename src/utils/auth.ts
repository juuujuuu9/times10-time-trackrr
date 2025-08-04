import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserSession;
  error?: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Token generation
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Session validation
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// Role-based access control
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [ROLES.ADMIN]: 3,
    [ROLES.MANAGER]: 2,
    [ROLES.USER]: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessAdmin(userRole: UserRole): boolean {
  return hasPermission(userRole, ROLES.ADMIN);
}

export function canAccessManager(userRole: UserRole): boolean {
  return hasPermission(userRole, ROLES.MANAGER);
} 