/**
 * Cryptographically secure ID generation
 * Uses Web Crypto API for secure random number generation
 */
export function generateSecureId(size: number = 21): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  const bytes = new Uint8Array(size);
  
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(bytes);
  } else {
    throw new Error('Crypto API not available');
  }
  
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  
  return id;
}

/**
 * Generate a secure token for authentication
 */
export function generateSecureToken(size: number = 32): string {
  return generateSecureId(size);
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return generateSecureId(48);
}
