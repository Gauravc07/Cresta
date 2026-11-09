/*
 * JSON API.
 *   Public: GET /api/content, /api/content/blog/:slug, /api/content/project/:slug; POST /api/enquiries
 *   Admin:  /api/admin/*, which needs a session cookie (HttpOnly, SameSite=Strict, scoped to /api/admin)
 * Every write is parameterised and limited to the fields listed in RESOURCES.
 */
import { createHash, randomBytes } from 'node:crypto';
import { dumpAll } from './backup.mjs';
import { findPost, findProject, publicContent, refresh } from './content.mjs';
import { query, tx } from './db.mjs';
import { hashPassword, passwordProblem, tempPassword, verifyPassword } from './password.mjs';

const COOKIE = 'cresta_admin';
const SESSION_HOURS = 12;
const MAX_JSON = 256 * 1024;
const MAX_UPLOAD = 6 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (message) => new ApiError(400, message);

// ---------- field validators ----------
const text = (label, max, { required = false } = {}) => (v) => {
  const s = v == null ? '' : String(v).trim();
  if (required && !s) throw bad(`${label} is required.`);
  if (s.length > max) throw bad(`${label} must be at most ${max} characters.`);
  return s || null;
};
const slug = (label) => (v) => {
  const s = String(v ?? '').trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) || s.length > 120) throw bad(`${label} may only use lowercase letters, numbers and hyphens.`);
  return s;
};
const bool = (v) => v === true || v === 'true';
const int = (label, min, max) => (v) => {
  const n = Number(v ?? 0);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${label} must be a whole number from ${min} to ${max}.`);
  return n;
};
const oneOf = (label, list) => (v) => {
  if (!list.includes(v)) throw bad(`${label} is not valid.`);
  return v;
};
/** Site-relative image: built-in or uploaded. Blocks javascript:, data: and other sites. */
const imagePath = (label, { required = false } = {}) => (v) => {
  const s = String(v ?? '').trim();
  if (!s) { if (required) throw bad(`${label} is required.`); return null; }
  if (!/^\/(img|media|brand)\/[A-Za-z0-9._/-]+$/.test(s) || s.includes('..')) throw bad(`${label} must be an uploaded or built-in image.`);
  return s;
};
const linkUrl = (label) => (v) => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (!/^(\/(?!\/)|https:\/\/)[^\s<>"']*$/.test(s) || s.length > 500) throw bad(`${label} must start with / or https://`);
  return s;
};
const gallery = (v) => {
  if (!Array.isArray(v) || v.length > 40) throw bad('A project can have up to 40 images.');
  const check = imagePath('Gallery image', { required: true });
  const alt = text('Image description', 200);
  return JSON.stringify(v.map((img) => ({ src: check(img?.src), alt: alt(img?.alt) ?? '' })));
};

// ---------- content types managed through the generic create/read/update/delete routes ----------
const RESOURCES = {
  blogs: {
    order: 'created_at desc',
    listColumns: 'id, title, slug, category, status, published_at, updated_at',
    fields: {
      title: text('Title', 200, { required: true }), slug: slug('Slug'), category: text('Category', 80),
      excerpt: text('Excerpt', 400), image_path: imagePath('Image'), image_alt: text('Image description', 200),
      content: text('Content', 100_000), meta_title: text('Meta title', 70), meta_description: text('Meta description', 170),
      status: oneOf('Status', ['draft', 'published']),
    },
    slugBase: '/blog/',
    active: (r) => r.status === 'published',
  },
  projects: {
    order: 'sort, created_at desc',
    listColumns: 'id, name, slug, location, images, sort, is_published, updated_at',
    fields: {
      name: text('Project name', 200, { required: true }), slug: slug('Slug'), location: text('Location', 160),
      description: text('Description', 20_000), images: gallery, sort: int('Order', 0, 9999), is_published: bool,
    },
    slugBase: '/projects/',
    active: (r) => r.is_published,
  },
  testimonials: {
    order: 'sort, created_at desc',
    fields: {
      name: text('Name', 120, { required: true }), photo_path: imagePath('Photo'), review: text('Review', 2000, { required: true }),
      rating: int('Rating', 1, 5), sort: int('Order', 0, 9999), is_published: bool,
    },
  },
  banners: {
    order: 'sort, created_at',
    fields: {
      eyebrow: text('Small heading', 120), title: text('Title', 80, { required: true }), subtitle: text('Subtitle', 300),
      image_path: imagePath('Image', { required: true }), image_alt: text('Image description', 200),
      cta_label: text('Button label', 40), cta_url: linkUrl('Button link'), sort: int('Order', 0, 9999), is_active: bool,
    },
  },
  products: {
    order: 'sort',
    idField: true,
    idValidator: slug('Product ID'),
    fields: {
      category_id: text('Category', 60, { required: true }), label: text('Label', 60), name: text('Name', 160, { required: true }),
      description: text('Description', 1000), image_path: imagePath('Image'), is_photo: bool, datasheet_url: linkUrl('Datasheet link'),
      sort: int('Order', 0, 9999), is_published: bool,
    },
  },
};

const SETTING_FIELDS = {
  phone_display: text('Phone', 40, { required: true }),
  phone_tel: (v) => {
    const s = String(v ?? '').replace(/\s/g, '');
    if (!/^\+?[0-9]{7,16}$/.test(s)) throw bad('Phone for call links must contain digits only, for example +919552526371.');
    return s;
  },
  landline: text('Landline', 40),
  whatsapp: (v) => {
    const s = String(v ?? '').replace(/\D/g, '');
    if (s.length < 7 || s.length > 16) throw bad('WhatsApp must be a full number with country code.');
    return s;
  },
  email: (v) => {
    const s = String(v ?? '').trim();
    if (!/^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(s) || s.length > 200) throw bad('Enter a valid email address.');
    return s;
  },
  office_address: text('Office address', 300, { required: true }),
  factory_address: text('Factory address', 300, { required: true }),
  hours_week: text('Working hours', 120, { required: true }),
  hours_sunday: text('Sunday hours', 120, { required: true }),
  branches: text('Regions', 400, { required: true }),
  site_title: text('Site title', 70, { required: true }),
  site_description: text('Site description', 170, { required: true }),
  site_url: (v) => {
    const s = String(v ?? '').trim().replace(/\/+$/, '');
    if (s && !/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(s)) throw bad('Website address must look like https://www.example.com');
    return s;
  },
  ga_id: (v) => {
    const s = String(v ?? '').trim();
    if (s && !/^G-[A-Z0-9]{4,20}$/.test(s)) throw bad('Analytics ID must look like G-XXXXXXXXXX.');
    return s;
  },
  gsc_token: (v) => {
    const s = String(v ?? '').trim();
    if (s && !/^[A-Za-z0-9_-]{10,100}$/.test(s)) throw bad('Paste only the content value of the Search Console verification tag.');
    return s;
  },
  facebook_url: linkUrl('Facebook link'),
  instagram_url: linkUrl('Instagram link'),
  linkedin_url: linkUrl('LinkedIn link'),
  youtube_url: linkUrl('YouTube link'),
};

// ---------- request helpers ----------
function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0; let done = false;
    req.on('data', (c) => {
      if (done) return;
      size += c.length;
      if (size > limit) { done = true; reject(new ApiError(413, 'That is too large to upload.')); return; }
      chunks.push(c);
    });
    req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks)); } });
    req.on('error', (err) => { if (!done) { done = true; reject(err); } });
  });
}

async function readJson(req) {
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new ApiError(415, 'Send JSON.');
  try { return JSON.parse((await readBody(req, MAX_JSON)).toString('utf8') || '{}'); } catch (err) {
    if (err instanceof ApiError) throw err;
    throw bad('Invalid JSON.');
  }
}

function clientIp(req) {
  if (process.env.TRUST_PROXY) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress || 'unknown';
}

/** Refuses requests from other sites. There is no CORS, so a foreign page cannot send these headers or read replies. */
function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let host;
  try { host = new URL(origin).host; } catch { throw new ApiError(403, 'Bad origin.'); }
  if (host !== req.headers.host) throw new ApiError(403, 'Bad origin.');
}

function limiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    const entry = hits.get(key);
    if (!entry || entry.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
    entry.n += 1;
    return entry.n <= max;
  };
}
const loginLimit = limiter(20, 15 * 60_000);
const enquiryLimit = limiter(10, 10 * 60_000);

// ---------- sessions ----------
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

function cookieHeader(req, value, maxAge) {
  const secure = req.socket.encrypted || (process.env.TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https');
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
const readCookie = (req) => String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);

async function currentUser(req) {
  const token = readCookie(req);
  if (!token || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const { rows } = await query(
    `select u.id, u.username, u.name, u.must_change_password
     from cresta.admin_sessions s join cresta.admin_users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now() and u.is_active`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

async function startSession(req, userId) {
  const token = randomBytes(32).toString('base64url');
  await query('delete from cresta.admin_sessions where expires_at < now()');
  await query(
    'insert into cresta.admin_sessions (token_hash, user_id, expires_at) values ($1, $2, now() + make_interval(hours => $3))',
    [hashToken(token), userId, SESSION_HOURS],
  );
  return cookieHeader(req, token, SESSION_HOURS * 3600);
}

// A hash of a random value, so an unknown username takes as long to reject as a wrong password.
const dummyHash = hashPassword(randomBytes(16).toString('hex'));

async function login(req, res) {
  if (!loginLimit(clientIp(req))) throw new ApiError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
  const body = await readJson(req);
  const username = String(body.username ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const { rows } = await query('select * from cresta.admin_users where username = $1', [username]);
  const user = rows[0];

  if (user?.locked_until && new Date(user.locked_until) > new Date()) {
    throw new ApiError(429, 'This account is locked after too many attempts. Try again in 15 minutes.');
  }
  const ok = await verifyPassword(password.slice(0, 200), user?.password_hash ?? await dummyHash);
  if (!user || !user.is_active || !ok) {
    if (user) {
      await query(
        `update cresta.admin_users set
           locked_until = case when failed_attempts >= 4 then now() + interval '15 minutes' else locked_until end,
           failed_attempts = case when failed_attempts >= 4 then 0 else failed_attempts + 1 end
         where id = $1`,
        [user.id],
      );
    }
    throw new ApiError(401, 'Incorrect username or password.');
  }
  await query('update cresta.admin_users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = $1', [user.id]);
  const cookie = await startSession(req, user.id);
  json(res, 200, { user: { username: user.username, name: user.name, must_change_password: user.must_change_password } }, { 'Set-Cookie': cookie });
}

async function logout(req, res) {
  const token = readCookie(req);
  if (token) await query('delete from cresta.admin_sessions where token_hash = $1', [hashToken(token)]);
  json(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader(req, '', 0) });
}

async function changePassword(req, res, user) {
  const body = await readJson(req);
  const { rows } = await query('select password_hash from cresta.admin_users where id = $1', [user.id]);
  if (!(await verifyPassword(String(body.current ?? '').slice(0, 200), rows[0].password_hash))) throw bad('Your current password is incorrect.');
  const problem = passwordProblem(body.next, user.username);
  if (problem) throw bad(problem);
  if (body.next === body.current) throw bad('Choose a password different from the current one.');
  const hash = await hashPassword(body.next);
  await tx(async (c) => {
    await c.query('update cresta.admin_users set password_hash = $1, must_change_password = false where id = $2', [hash, user.id]);
    await c.query('delete from cresta.admin_sessions where user_id = $1', [user.id]); // signs out every other device
  });
  const cookie = await startSession(req, user.id);
  json(res, 200, { ok: true }, { 'Set-Cookie': cookie });
}

// ---------- generic resource routes ----------
function sqlParts(def, body, partial) {
  const cols = []; const vals = [];
  for (const [name, validate] of Object.entries(def.fields)) {
    if (partial && !(name in body)) continue;
    cols.push(name);
    vals.push(validate(body[name]));
  }
  if (!cols.length) throw bad('Nothing to save.');
  return { cols, vals };
}

function friendlyDbError(err) {
  if (err.code === '23505') return new ApiError(409, 'That slug or ID is already in use.');
  if (err.code === '23503') return new ApiError(409, 'That item is linked to other records, or its category does not exist.');
  if (err.code === '23514') return bad('One of the values is not allowed.');
  return err;
}

async function resourceRoute(req, res, name, id) {
  const def = Object.hasOwn(RESOURCES, name) ? RESOURCES[name] : null;
  if (!def) throw new ApiError(404, 'Not found.');
  if (id && !def.idField && !UUID.test(id)) throw new ApiError(404, 'Not found.');

  if (req.method === 'GET' && !id) {
    const { rows } = await query(`select ${def.listColumns ?? '*'} from cresta.${name} order by ${def.order}`);
    return json(res, 200, { rows });
  }
  if (req.method === 'GET') {
    const { rows } = await query(`select * from cresta.${name} where id = $1`, [id]);
    if (!rows[0]) throw new ApiError(404, 'Not found.');
    return json(res, 200, { row: rows[0] });
  }
  if (req.method === 'POST' && !id) {
    const body = await readJson(req);
    const { cols, vals } = sqlParts(def, body, false);
    if (def.idField) { cols.unshift('id'); vals.unshift(def.idValidator(body.id)); }
    const published = name === 'blogs' && body.status === 'published';
    const { rows } = await query(
      `insert into cresta.${name} (${cols.join(', ')}${published ? ', published_at' : ''})
       values (${cols.map((_, i) => `$${i + 1}`).join(', ')}${published ? ', now()' : ''}) returning *`,
      vals,
    );
    await refresh();
    return json(res, 201, { row: rows[0] });
  }
  if (req.method === 'PUT' && id) {
    const body = await readJson(req);
    const { cols, vals } = sqlParts(def, body, true);
    const row = await tx(async (c) => {
      const before = (await c.query(`select * from cresta.${name} where id = $1 for update`, [id])).rows[0];
      if (!before) throw new ApiError(404, 'Not found.');
      const sets = cols.map((col, i) => `${col} = $${i + 2}`);
      const updated = (await c.query(`update cresta.${name} set ${sets.join(', ')} where id = $1 returning *`, [id, ...vals])).rows[0];
      if (name === 'blogs' && updated.status === 'published' && !updated.published_at) {
        updated.published_at = (await c.query('update cresta.blogs set published_at = now() where id = $1 returning published_at', [id])).rows[0].published_at;
      }
      // Keep search rankings and old links working when a live page's address changes.
      if (def.slugBase && before.slug !== updated.slug && def.active(before)) {
        const from = def.slugBase + before.slug; const to = def.slugBase + updated.slug;
        await c.query('update cresta.redirects set to_path = $1 where to_path = $2', [to, from]);
        await c.query('delete from cresta.redirects where from_path = $1', [to]);
        await c.query('insert into cresta.redirects (from_path, to_path) values ($1, $2) on conflict (from_path) do update set to_path = excluded.to_path', [from, to]);
      }
      return updated;
    });
    await refresh();
    return json(res, 200, { row });
  }
  if (req.method === 'DELETE' && id) {
    const { rowCount } = await query(`delete from cresta.${name} where id = $1`, [id]);
    if (!rowCount) throw new ApiError(404, 'Not found.');
    await refresh();
    return json(res, 200, { ok: true });
  }
  throw new ApiError(405, 'Method not allowed.');
}

// ---------- enquiries ----------
async function enquiriesRoute(req, res, id, url) {
  if (req.method === 'GET') {
    const status = url.searchParams.get('status');
    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
    const page = Math.max(0, Math.floor(Number(url.searchParams.get('page'))) || 0);
    const where = []; const params = [];
    if (['new', 'contacted', 'closed'].includes(status)) { params.push(status); where.push(`status = $${params.length}`); }
    if (q) {
      params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
      const n = params.length;
      where.push(`(name ilike $${n} or phone ilike $${n} or email ilike $${n} or message ilike $${n} or company ilike $${n})`);
    }
    const clause = where.length ? `where ${where.join(' and ')}` : '';
    const size = 50;
    const [list, total, counts] = await Promise.all([
      query(`select * from cresta.enquiries ${clause} order by created_at desc limit ${size} offset ${page * size}`, params),
      query(`select count(*)::int n from cresta.enquiries ${clause}`, params),
      query('select status, count(*)::int n from cresta.enquiries group by status'),
    ]);
    return json(res, 200, { rows: list.rows, total: total.rows[0].n, size, counts: Object.fromEntries(counts.rows.map((r) => [r.status, r.n])) });
  }
  if (req.method === 'PATCH' && id && UUID.test(id)) {
    const body = await readJson(req);
    const status = oneOf('Status', ['new', 'contacted', 'closed'])(body.status);
    const notes = text('Notes', 4000)(body.notes);
    const { rows } = await query('update cresta.enquiries set status = $2, notes = $3 where id = $1 returning *', [id, status, notes]);
    if (!rows[0]) throw new ApiError(404, 'Not found.');
    return json(res, 200, { row: rows[0] });
  }
  throw new ApiError(405, 'Method not allowed.');
}

// ---------- users ----------
const USER_COLUMNS = 'id, username, name, is_active, must_change_password, last_login_at, created_at';

async function usersRoute(req, res, id, me) {
  if (req.method === 'GET') {
    const { rows } = await query(`select ${USER_COLUMNS} from cresta.admin_users order by created_at`);
    return json(res, 200, { rows, me: me.id });
  }
  if (req.method === 'POST' && !id) {
    const body = await readJson(req);
    const username = String(body.username ?? '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw bad('Username must be 3 to 40 lowercase letters, numbers, dots or hyphens.');
    const name = text('Name', 120, { required: true })(body.name);
    const temp = tempPassword();
    const { rows } = await query(
      `insert into cresta.admin_users (username, name, password_hash) values ($1, $2, $3) returning ${USER_COLUMNS}`,
      [username, name, await hashPassword(temp)],
    );
    return json(res, 201, { row: rows[0], temp_password: temp });
  }
  if (req.method === 'PATCH' && id && UUID.test(id)) {
    const body = await readJson(req);
    if (id === me.id) throw bad('You cannot change your own access here. Use Change password instead.');
    if ('is_active' in body) {
      const active = bool(body.is_active);
      const { rows } = await query(`update cresta.admin_users set is_active = $2 where id = $1 returning ${USER_COLUMNS}`, [id, active]);
      if (!rows[0]) throw new ApiError(404, 'Not found.');
      if (!active) await query('delete from cresta.admin_sessions where user_id = $1', [id]);
      return json(res, 200, { row: rows[0] });
    }
    if (body.reset_password) {
      const temp = tempPassword();
      const { rows } = await query(
        `update cresta.admin_users set password_hash = $2, must_change_password = true, failed_attempts = 0, locked_until = null
         where id = $1 returning ${USER_COLUMNS}`,
        [id, await hashPassword(temp)],
      );
      if (!rows[0]) throw new ApiError(404, 'Not found.');
      await query('delete from cresta.admin_sessions where user_id = $1', [id]);
      return json(res, 200, { row: rows[0], temp_password: temp });
    }
    throw bad('Nothing to change.');
  }
  throw new ApiError(405, 'Method not allowed.');
}

// ---------- media ----------
function sniffImage(buf) {
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return ['image/webp', 'webp'];
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ['image/jpeg', 'jpg'];
  if (buf.length > 8 && buf.toString('latin1', 0, 8) === '\x89PNG\r\n\x1a\n') return ['image/png', 'png'];
  return null;
}
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

async function mediaRoute(req, res, url) {
  if (req.method === 'GET') {
    const { rows } = await query('select id, filename, mime, size, created_at from cresta.media order by created_at desc limit 200');
    return json(res, 200, { rows: rows.map((m) => ({ ...m, url: `/media/${m.id}.${EXT[m.mime]}` })) });
  }
  if (req.method === 'POST') {
    const buf = await readBody(req, MAX_UPLOAD);
    const kind = sniffImage(buf); // Decided from the file's bytes, so a script or SVG cannot be uploaded as an image.
    if (!kind) throw bad('Upload a JPG, PNG or WebP image.');
    const filename = (url.searchParams.get('name') ?? 'image').replace(/[^\w.\- ]/g, '').slice(0, 120) || 'image';
    const { rows } = await query('insert into cresta.media (filename, mime, size, data) values ($1, $2, $3, $4) returning id', [filename, kind[0], buf.length, buf]);
    return json(res, 201, { url: `/media/${rows[0].id}.${kind[1]}` });
  }
  throw new ApiError(405, 'Method not allowed.');
}

/** Public uploaded image: GET /media/<uuid>.<ext>. Returns false when the address is not a known image. */
export async function serveMedia(req, res, baseHeaders, pathname) {
  const m = pathname.match(/^\/media\/([0-9a-f-]{36})\.(webp|jpg|png)$/);
  if (!m || !UUID.test(m[1])) return false;
  let row;
  try { ({ rows: [row] } = await query('select mime, data from cresta.media where id = $1', [m[1]])); } catch (err) {
    console.error('[media]', err.message);
    res.writeHead(503, { ...baseHeaders, 'Cache-Control': 'no-store' });
    res.end();
    return true;
  }
  if (!row) return false;
  res.writeHead(200, {
    ...baseHeaders,
    'Content-Type': row.mime,
    'Content-Length': row.data.length,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  res.end(req.method === 'HEAD' ? undefined : row.data);
  return true;
}

// ---------- settings, dashboard ----------
async function settingsRoute(req, res) {
  if (req.method === 'GET') {
    const { rows } = await query('select key, value from cresta.settings');
    return json(res, 200, { settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
  }
  if (req.method === 'PUT') {
    const body = await readJson(req);
    const entries = Object.entries(SETTING_FIELDS).filter(([k]) => k in body).map(([k, validate]) => [k, validate(body[k]) ?? '']);
    await tx(async (c) => {
      for (const [k, v] of entries) {
        await c.query('insert into cresta.settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value', [k, v]);
      }
    });
    await refresh();
    return json(res, 200, { ok: true });
  }
  throw new ApiError(405, 'Method not allowed.');
}

async function dashboardRoute(res) {
  const { rows: [counts] } = await query(`select
    (select count(*)::int from cresta.enquiries) as enquiries,
    (select count(*)::int from cresta.enquiries where status = 'new') as new_enquiries,
    (select count(*)::int from cresta.blogs) as blogs,
    (select count(*)::int from cresta.blogs where status = 'published') as published_blogs,
    (select count(*)::int from cresta.projects) as projects,
    (select count(*)::int from cresta.testimonials) as testimonials`);
  const { rows: recent } = await query('select id, name, phone, topic, status, created_at from cresta.enquiries order by created_at desc limit 6');
  return json(res, 200, { counts, recent });
}

// ---------- public enquiry form ----------
const TOPICS = ['frp', 'equipment', 'treatment', 'commercial', 'wellness', 'dealer', 'service', 'other'];

async function submitEnquiry(req, res) {
  assertSameOrigin(req);
  if (!enquiryLimit(clientIp(req))) throw new ApiError(429, 'You have sent several enquiries already. Our team will be in touch shortly.');
  const body = await readJson(req);
  if (body.website) return json(res, 201, { ok: true }); // honeypot: pretend it worked
  const phone = String(body.phone ?? '').trim();
  if (!/^[0-9+()\-\s]{7,30}$/.test(phone)) throw bad('Please enter a valid phone number.');
  const email = text('Email', 200)(body.email);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw bad('Please enter a valid email address.');
  const values = [
    text('Name', 120, { required: true })(body.name), text('Company', 160)(body.company), phone, email,
    text('City', 120)(body.city), oneOf('Topic', TOPICS)(body.topic), text('Message', 4000, { required: true })(body.message),
    text('Product', 200)(body.product), text('Source page', 200)(body.source_page),
  ];
  try {
    await tx(async (c) => {
      // The enquiry_guard trigger applies its rate limits when the request is marked as a public one.
      await c.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
      await c.query(
        `insert into cresta.enquiries (name, company, phone, email, city, topic, message, product, source_page)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values,
      );
    });
  } catch (err) {
    if (err.code === 'P0001') throw new ApiError(429, err.message);
    if (err.code === '23514') throw bad('Please check the details and try again.');
    throw err;
  }
  return json(res, 201, { ok: true });
}

// ---------- router ----------
async function adminRoute(req, res, url, parts) {
  const [section, id] = parts;
  if (section === 'login' && req.method === 'POST') { assertSameOrigin(req); return login(req, res); }

  if (req.method !== 'GET') {
    assertSameOrigin(req);
    if (req.headers['x-requested-with'] !== 'cresta-admin') throw new ApiError(403, 'Missing request header.');
  }
  const user = await currentUser(req);
  if (!user) throw new ApiError(401, 'Please sign in.');

  if (section === 'me') return json(res, 200, { user: { username: user.username, name: user.name, must_change_password: user.must_change_password } });
  if (section === 'logout' && req.method === 'POST') return logout(req, res);
  if (section === 'password' && req.method === 'POST') return changePassword(req, res, user);
  if (user.must_change_password) throw new ApiError(403, 'Please set a new password first.');

  switch (section) {
    case 'dashboard': return dashboardRoute(res);
    case 'enquiries': return enquiriesRoute(req, res, id, url);
    case 'settings': return settingsRoute(req, res);
    case 'users': return usersRoute(req, res, id, user);
    case 'media': return mediaRoute(req, res, url);
    case 'categories': {
      const { rows } = await query('select id, name from cresta.categories order by sort');
      return json(res, 200, { rows });
    }
    case 'backup': {
      const stamp = new Date().toISOString().slice(0, 10);
      return json(res, 200, await dumpAll(), { 'Content-Disposition': `attachment; filename="cresta-backup-${stamp}.json"` });
    }
    case 'r': return resourceRoute(req, res, parts[1], parts[2]);
    default: throw new ApiError(404, 'Not found.');
  }
}

export async function handleApi(req, res, url) {
  res.setHeader('X-Robots-Tag', 'noindex');
  try {
    const parts = url.pathname.split('/').filter(Boolean).slice(1).map((p) => {
      try { return decodeURIComponent(p); } catch { throw bad('Bad address.'); }
    });
    if (parts[0] === 'content' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (!parts[1]) return json(res, 200, publicContent(), { 'Cache-Control': 'public, max-age=30' });
      const found = parts[1] === 'blog' ? findPost(parts[2]) : parts[1] === 'project' ? findProject(parts[2]) : null;
      if (!found) throw new ApiError(404, 'Not found.');
      return json(res, 200, found, { 'Cache-Control': 'public, max-age=30' });
    }
    if (parts[0] === 'enquiries' && req.method === 'POST') return await submitEnquiry(req, res);
    if (parts[0] === 'admin') return await adminRoute(req, res, url, parts.slice(1));
    throw new ApiError(404, 'Not found.');
  } catch (raw) {
    const err = friendlyDbError(raw);
    if (err instanceof ApiError) return json(res, err.status, { error: err.message });
    console.error('[api]', req.method, url.pathname, err.message);
    return json(res, 503, { error: 'The service is unavailable. Please try again shortly.' });
  }
}
