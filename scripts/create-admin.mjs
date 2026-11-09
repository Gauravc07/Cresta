/*
 * Creates a Cresta admin, or resets a password when someone is locked out.
 *
 *   npm run admin:create -- --username admin --name "Cresta Admin"
 *   npm run admin:create -- --username admin --reset
 *
 * Prints a temporary password, which must be changed at first sign-in.
 * Touches only cresta.admin_users and cresta.admin_sessions.
 */
import { closePool, query } from '../server/db.mjs';
import { hashPassword, tempPassword } from '../server/password.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const username = String(opt('username') ?? '').trim().toLowerCase();
const name = opt('name');
const reset = args.includes('--reset');

if (!/^[a-z0-9._-]{3,40}$/.test(username) || (!reset && !name)) {
  console.error('Usage: npm run admin:create -- --username <username> --name "<full name>"   (or --username <username> --reset)');
  process.exit(1);
}

const temp = tempPassword();
const hash = await hashPassword(temp);
try {
  if (reset) {
    const { rows } = await query(
      `update cresta.admin_users set password_hash = $2, must_change_password = true, failed_attempts = 0, locked_until = null, is_active = true
       where username = $1 returning id`,
      [username, hash],
    );
    if (!rows[0]) throw new Error(`No admin named "${username}".`);
    await query('delete from cresta.admin_sessions where user_id = $1', [rows[0].id]);
    console.log(`Password reset for ${username}.`);
  } else {
    await query('insert into cresta.admin_users (username, name, password_hash) values ($1, $2, $3)', [username, name, hash]);
    console.log(`Created admin ${username}.`);
  }
  console.log(`Temporary password: ${temp}`);
  console.log('It must be changed at first sign-in.');
} catch (err) {
  console.error(err.code === '23505' ? `"${username}" already exists. Use --reset to set a new password.` : err.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
