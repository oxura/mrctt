import { generateSecureId } from './crypto';

/**
 * Generate a cryptographically secure ID
 * @deprecated Use generateSecureId from crypto.ts for better security
 */
export function nanoid(size: number = 21): string {
  return generateSecureId(size);
}
