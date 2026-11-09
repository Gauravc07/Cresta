-- =====================================================================
-- Cresta admin panel and CMS (schema `cresta` only; idempotent)
-- These tables are reached only by the Cresta server (server/*.mjs), never by the
-- browser: RLS is on with no policies, and anon/authenticated have no grants.
-- Admin accounts are separate from Supabase Auth, so Crystal Pools logins are unaffected.
-- =====================================================================

-- Enquiry statuses are now New / Contacted / Closed.
alter table cresta.enquiries drop constraint if exists enquiries_status_check;
update cresta.enquiries set status = 'contacted' where status = 'quoted';
update cresta.enquiries set status = 'closed' where status in ('won', 'lost', 'spam');
alter table cresta.enquiries add constraint enquiries_status_check check (status in ('new', 'contacted', 'closed'));

create table if not exists cresta.admin_users (
  id                   uuid primary key default gen_random_uuid(),
  username             text not null unique check (username ~ '^[a-z0-9._-]{3,40}$'),
  name                 text not null check (char_length(name) between 1 and 120),
  password_hash        text not null,
  must_change_password boolean not null default true,
  is_active            boolean not null default true,
  failed_attempts      integer not null default 0,
  locked_until         timestamptz,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists cresta.admin_sessions (
  token_hash text primary key,
  user_id    uuid not null references cresta.admin_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists admin_sessions_user_idx on cresta.admin_sessions (user_id);

create table if not exists cresta.blogs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category         text,
  excerpt          text,
  image_path       text,
  image_alt        text,
  content          text not null default '',
  meta_title       text,
  meta_description text,
  status           text not null default 'draft' check (status in ('draft', 'published')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists blogs_status_published_idx on cresta.blogs (status, published_at desc);

create table if not exists cresta.projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 200),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location     text,
  description  text,
  images       jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  sort         integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists cresta.testimonials (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  photo_path   text,
  review       text not null check (char_length(review) between 1 and 2000),
  rating       integer not null default 5 check (rating between 1 and 5),
  sort         integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists cresta.banners (
  id         uuid primary key default gen_random_uuid(),
  eyebrow    text,
  title      text not null check (char_length(title) between 1 and 80),
  subtitle   text,
  image_path text not null,
  image_alt  text,
  cta_label  text,
  cta_url    text,
  sort       integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Uploaded images live in the database so they are included in backups.
create table if not exists cresta.media (
  id         uuid primary key default gen_random_uuid(),
  filename   text not null,
  mime       text not null check (mime in ('image/webp', 'image/jpeg', 'image/png')),
  size       integer not null,
  data       bytea not null,
  created_at timestamptz not null default now()
);

-- Old address -> new address, served as a 301 (written when a published slug changes).
create table if not exists cresta.redirects (
  from_path  text primary key check (from_path like '/%'),
  to_path    text not null check (to_path like '/%'),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['admin_users','blogs','projects','testimonials','banners'] loop
    execute format('drop trigger if exists set_updated_at on cresta.%I', t);
    execute format('create trigger set_updated_at before update on cresta.%I for each row execute function cresta.set_updated_at()', t);
  end loop;
  foreach t in array array['admin_users','admin_sessions','blogs','projects','testimonials','banners','media','redirects'] loop
    execute format('alter table cresta.%I enable row level security', t);
    execute format('revoke all on cresta.%I from public, anon, authenticated', t);
  end loop;
end $$;
