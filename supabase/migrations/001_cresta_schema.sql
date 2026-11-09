-- =====================================================================
-- Cresta schema
-- Self-contained: creates and modifies objects ONLY inside schema `cresta`.
-- Safe to re-run (idempotent). Nothing in `public` or other schemas is touched.
-- =====================================================================

create schema if not exists cresta;
comment on schema cresta is 'Cresta (a Crystal Pools company) — website content and enquiries';

-- ---------- helpers ----------
create or replace function cresta.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- site settings (key/value) ----------
create table if not exists cresta.settings (
  key        text primary key check (key ~ '^[a-z0-9_]+$'),
  value      text not null,
  updated_at timestamptz not null default now()
);

-- ---------- product catalogue ----------
create table if not exists cresta.categories (
  id         text primary key check (id ~ '^[a-z0-9-]+$'),
  name       text not null,
  blurb      text,
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cresta.products (
  id            text primary key check (id ~ '^[a-z0-9-]+$'),
  category_id   text not null references cresta.categories (id) on update cascade on delete restrict,
  label         text,
  name          text not null,
  description   text,
  image_path    text,
  is_photo      boolean not null default false,
  datasheet_url text,
  sort          integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists products_category_sort_idx on cresta.products (category_id, sort);

-- ---------- FRP pool range ----------
create table if not exists cresta.frp_collections (
  id         text primary key check (id ~ '^[a-z0-9-]+$'),
  name       text not null,
  blurb      text,
  sort       integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cresta.frp_models (
  id            text primary key check (id ~ '^[a-z0-9-]+$'),
  collection_id text not null references cresta.frp_collections (id) on update cascade on delete restrict,
  width_ft      numeric(5,2) not null check (width_ft > 0),   -- diameter for round pools
  length_ft     numeric(5,2) check (length_ft is null or length_ft > 0), -- null = round
  sort          integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists frp_models_collection_sort_idx on cresta.frp_models (collection_id, sort);

-- ---------- downloads ----------
create table if not exists cresta.downloads (
  id           text primary key check (id ~ '^[a-z0-9-]+$'),
  title        text not null,
  subtitle     text,
  url          text not null,
  category     text,
  featured     boolean not null default false,
  sort         integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- enquiries (website form) ----------
create table if not exists cresta.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 120),
  company     text check (company is null or char_length(company) <= 160),
  phone       text not null check (char_length(phone) between 7 and 30),
  email       text check (email is null or (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  city        text check (city is null or char_length(city) <= 120),
  topic       text not null check (topic in ('frp','equipment','treatment','commercial','wellness','dealer','service','other')),
  message     text not null check (char_length(message) between 1 and 4000),
  product     text check (product is null or char_length(product) <= 200),
  source_page text check (source_page is null or char_length(source_page) <= 200),
  status      text not null default 'new' check (status in ('new','contacted','quoted','won','lost','spam')),
  notes       text
);
create index if not exists enquiries_created_idx on cresta.enquiries (created_at desc);
create index if not exists enquiries_status_idx on cresta.enquiries (status);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['settings','categories','products','frp_collections','frp_models','downloads','enquiries'] loop
    execute format('drop trigger if exists set_updated_at on cresta.%I', t);
    execute format('create trigger set_updated_at before update on cresta.%I for each row execute function cresta.set_updated_at()', t);
  end loop;
end $$;

-- ---------- row level security ----------
alter table cresta.settings        enable row level security;
alter table cresta.categories      enable row level security;
alter table cresta.products        enable row level security;
alter table cresta.frp_collections enable row level security;
alter table cresta.frp_models      enable row level security;
alter table cresta.downloads       enable row level security;
alter table cresta.enquiries       enable row level security;

-- Public (anon + signed-in) can read published content.
drop policy if exists "public read" on cresta.settings;
create policy "public read" on cresta.settings for select to anon, authenticated using (true);

drop policy if exists "public read" on cresta.categories;
create policy "public read" on cresta.categories for select to anon, authenticated using (true);

drop policy if exists "public read published" on cresta.products;
create policy "public read published" on cresta.products for select to anon, authenticated using (is_published);

drop policy if exists "public read" on cresta.frp_collections;
create policy "public read" on cresta.frp_collections for select to anon, authenticated using (true);

drop policy if exists "public read published" on cresta.frp_models;
create policy "public read published" on cresta.frp_models for select to anon, authenticated using (is_published);

drop policy if exists "public read published" on cresta.downloads;
create policy "public read published" on cresta.downloads for select to anon, authenticated using (is_published);

-- Visitors may submit enquiries but never read, edit or delete them.
drop policy if exists "public submit" on cresta.enquiries;
create policy "public submit" on cresta.enquiries for insert to anon, authenticated
  with check (status = 'new' and notes is null);

-- ---------- privileges ----------
grant usage on schema cresta to anon, authenticated, service_role;

grant select on cresta.settings, cresta.categories, cresta.products,
                cresta.frp_collections, cresta.frp_models, cresta.downloads
  to anon, authenticated;

-- Column-level: visitors can only fill the form fields (not status/notes/ids).
grant insert (name, company, phone, email, city, topic, message, product, source_page)
  on cresta.enquiries to anon, authenticated;

-- Admin tooling uses the secret (service_role) key, which bypasses RLS.
grant all on all tables in schema cresta to service_role;
grant execute on all functions in schema cresta to service_role;
alter default privileges in schema cresta grant all on tables to service_role;
