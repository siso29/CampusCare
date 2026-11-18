import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

/**
 * Securely hashes a plain-text password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Securely verifies a plain-text password against an Argon2id hash.
 */
export async function verifyPassword(
  hashedPassword: string,
  plainText: string,
): Promise<boolean> {
  try {
    return await verify(hashedPassword, plainText);
  } catch {
    return false;
  }
}

/**
 * Hashes a token using SHA-256 for secure constant-time storage in the database.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a high-entropy cryptographically secure random token.
 */
export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
