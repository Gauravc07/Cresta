/* scrypt password hashing with no external dependency. Stored as scrypt$N$r$p$salt$hash. */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 32768; const R = 8; const P = 1; const LEN = 64;
const derive = (password, salt, n, r, p) => new Promise((resolve, reject) => {
  scrypt(password.normalize('NFKC'), salt, LEN, { N: n, r, p, maxmem: 256 * n * r }, (err, key) => (err ? reject(err) : resolve(key)));
});

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, n, r, p, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** 16 characters without look-alikes such as 0/O and 1/l. */
export function tempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(randomBytes(16), (b) => alphabet[b % alphabet.length]).join('');
}

const COMMON = new Set(['password123', 'password1234', 'admin12345', 'admin123456', 'qwerty12345', '1234567890', 'cresta12345', 'crestapools']);

/** Returns a problem message, or null when the password is acceptable. */
export function passwordProblem(password, username = '') {
  if (typeof password !== 'string' || password.length < 10) return 'Use at least 10 characters.';
  if (password.length > 200) return 'Use at most 200 characters.';
  if (COMMON.has(password.toLowerCase())) return 'That password is too common. Choose another.';
  if (username && password.toLowerCase().includes(username.toLowerCase())) return 'The password must not contain the username.';
  return null;
}
