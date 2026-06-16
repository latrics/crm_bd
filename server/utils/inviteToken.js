import crypto from 'crypto';

/**
 * Generates a random secure token.
 * @returns {string} Hex representation of random bytes.
 */
export function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a token using SHA-256.
 * @param {string} token 
 * @returns {string} Hex representation of the hashed token.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
