# Cresta website and admin panel

A React 19 site rendered on the server by a small Node server. Content, enquiries and admin accounts live in the **`cresta`** schema of the Supabase project. The browser only ever talks to this server.

```bash
npm install
npm run db:migrate    # create/update the cresta schema and add any missing starter rows
npm run build         # client bundle (dist/) and server renderer (dist-ssr/)
npm start             # http://127.0.0.1:8080  (admin: /admin)
npm run dev           # Vite dev server on :5173; run `npm start` as well for the API
```

| Command | What it does |
|---|---|
| `npm run admin:create -- --username <name> --name "<full name>"` | Creates an admin and prints a temporary password |
| `npm run admin:create -- --username <name> --reset` | Resets a password if someone is locked out |
| `npm run db:backup` | Writes `backups/cresta-<date>.json` |
| `npm run db:restore -- <file> --confirm` | Restores a backup (overwrites rows with the same ID, keeps newer rows) |
| `npm run db:migrate -- --reseed` | Overwrites existing rows with the seed values. **This discards admin edits to those rows** |

## Going live

The site needs a host that runs Node 20.6 or newer (a VPS, Render, Railway or similar). A static-only host won't work, because the forms, admin and page rendering all run on the server.

1. Set `SUPABASE_DB_URL` as a server environment variable. Never give it a `VITE_` prefix.
2. Set the real address in **Admin > Settings > Website address** (or `SITE_URL`). Canonical links, the sitemap and social sharing use it. **Until it is set, they point at the local address.**
3. Serve over HTTPS, using one of these:
   - Behind a proxy or platform: run `npm start` and set `TRUST_PROXY=1`, and `SITE_URL=https://…` to turn on HSTS. Only set `TRUST_PROXY` when a proxy you control is in front.
   - Directly: `TLS_CERT=/path/fullchain.pem TLS_KEY=/path/privkey.pem PORT=443 HTTP_PORT=80 HOST=0.0.0.0 npm start`
4. Add the Analytics ID and Search Console code in **Admin > Settings > Google**, then submit `/sitemap.xml` in Search Console.
5. Point `BACKUP_DIR` at persistent storage if the host's disk is wiped on deploy.

## Admin panel (`/admin`)

| Section | What it does |
|---|---|
| Dashboard | Totals for enquiries, blogs and projects; latest enquiries; backup download |
| Enquiries | All contact-form leads with search and filters. Status: New, Contacted, Closed; private notes |
| Blog | Add, edit and delete articles: title, slug, category, image, content, meta title and description, publish or draft |
| Projects | Add, edit and delete projects: name, location, description, image gallery |
| Testimonials | Add, edit and delete reviews: name, photo, review, rating |
| Banners | Homepage hero. Several active banners rotate as a slider |
| Products | Add, edit and delete catalogue products |
| Settings | Contact details, site title and description, website address, Google IDs, social links |
| Users | Add admins, reset passwords, disable accounts. Everyone can change their own password |

Enquiries are stored in the database and shown in the admin. There are no email alerts yet, because that needs an email-sending service.

### How the login is secured

- Accounts are in `cresta.admin_users`, separate from Supabase Auth, so Crystal Pools logins and permissions are unaffected in either direction.
- Passwords are hashed with scrypt. A temporary password must be changed at first sign-in.
- Sessions are random tokens, stored only as hashes, in an `HttpOnly`, `SameSite=Strict` cookie limited to `/api/admin` for 12 hours. Changing a password signs out other devices.
- An account locks for 15 minutes after 5 failed attempts, and each IP address is limited to 20 attempts per 15 minutes.
- Writes must come from the same origin and carry a custom header. There is no CORS.
- Fields are validated on the server against an allow-list, and all SQL is parameterised.
- Uploads are identified from the file's bytes (JPG, PNG or WebP only, so no SVG or scripts). Article text is rendered as React elements, never as raw HTML.
- `/admin` is `noindex`, disallowed in `robots.txt`, and not linked from the website.

## SEO

- **Server-rendered pages.** Crawlers get the full text without JavaScript, and missing pages return a real `404`.
- **Per-page tags.** Each page has a unique title (50 to 60 characters) and description (150 to 160), a canonical link, Open Graph and Twitter tags. Admin edits appear immediately.
- **Structured data.** Organization on every page, breadcrumbs, FAQPage on FRP and Contact, LocalBusiness for the office and factory, BlogPosting on articles.
- **Live `/sitemap.xml` and `/robots.txt`,** generated from published content. Empty Blog or Projects sections stay out of the sitemap and menu.
- **Redirects.** Changing the slug of a live article or project adds a 301 from the old address automatically.
- **One set of facts.** Founded 1993, 30+ years, `sales@crystalpools.in`, one main phone number. Keep listings on other sites matching.

## The `cresta` schema

| Table | Purpose |
|---|---|
| `settings` | Contact details, SEO and Google settings (key/value) |
| `categories`, `products` | Equipment catalogue |
| `frp_collections`, `frp_models` | FRP pool range |
| `downloads` | Datasheet and brochure request links |
| `enquiries` | Contact-form leads |
| `blogs`, `projects`, `testimonials`, `banners` | Admin-managed content |
| `media` | Uploaded images, stored in the database so they are included in backups |
| `redirects` | 301s for changed slugs |
| `admin_users`, `admin_sessions` | Admin login |

Migrations in `supabase/migrations/` only touch the `cresta` schema. Tables have row level security, and the admin tables grant nothing to `anon` or `authenticated`. The schema does not need to be exposed in the Supabase Data API.

`db:migrate` only adds missing rows, so it is safe to re-run without losing admin edits.

## Backups

The server writes a backup when it starts if there isn't a recent one, then every 24 hours, and keeps the latest 14 in `backups/` (git-ignored). Backups hold all content, enquiries and uploaded images, but not admin logins. They contain customer details, so store them carefully. Copy them off the server as well, because a backup on the same machine won't survive losing that machine.

## Security

Headers come from `security.config.js`: a strict Content-Security-Policy (`script-src 'self'`, `style-src 'self'`, no inline scripts or style attributes), HSTS on HTTPS, `X-Frame-Options: DENY`, `nosniff`, Permissions-Policy and COOP/CORP. Google Analytics domains are allowed only after an Analytics ID is set.

`server.mjs` reads only `SUPABASE_DB_URL` and its own settings from `.env`. `SUPABASE_SECRET_KEY` is never loaded, and nothing secret reaches the browser. The database URL has access to the whole shared project, so a dedicated database role limited to the `cresta` schema is a worthwhile hardening step before going live.

## Code map

```
server.mjs              routing, server rendering, sitemap, robots, static files, nightly backups
server/api.mjs          JSON API: public content, enquiries, admin (validation lists are here)
server/content.mjs      in-memory public content, refreshed on every admin write
server/backup.mjs       backup and restore
server/password.mjs     scrypt hashing
src/entry-server.jsx    renders a page to HTML
src/main.jsx            hydrates it in the browser
src/lib/seo.js          titles, tags and structured data
src/lib/data.js         content hooks and the enquiry call
src/lib/markdown.jsx    safe article renderer
src/pages, components   the public website
src/data/seed.js        starter content and fallback if the database is unreachable
admin/                  the admin app (its own entry; no admin code ships in the public bundle)
scripts/                migrations, admin:create, backups, seed articles, image builders
```

## Design and imagery

Jost and Italiana are self-hosted from `public/fonts/`. Colours and fonts are tokens at the top of `src/styles.css`. Photos are free Unsplash-licence images, listed in [`IMAGE-CREDITS.md`](IMAGE-CREDITS.md); no photos from crystalpools.in are used. Equipment images are original illustrations, used until there is studio photography; replace them under **Admin > Products**.
