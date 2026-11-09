-- =====================================================================
-- Enquiry abuse protection (schema `cresta` only; idempotent)
--  * normalises whitespace in submitted fields
--  * public submissions: max 3 per phone number per 10 minutes, 30 site-wide per minute
--  * public submissions can never set status/notes (also enforced by RLS + column grants)
-- Inserts made with the secret/service key (admin tools) are not rate-limited.
-- =====================================================================

create index if not exists enquiries_phone_created_idx on cresta.enquiries (phone, created_at desc);

create or replace function cresta.enquiry_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '');
  recent int;
begin
  new.name    := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.phone   := btrim(new.phone);
  new.email   := nullif(lower(btrim(coalesce(new.email, ''))), '');
  new.company := nullif(btrim(coalesce(new.company, '')), '');
  new.city    := nullif(btrim(coalesce(new.city, '')), '');
  new.message := btrim(new.message);

  if claim_role in ('anon', 'authenticated') then
    new.status := 'new';
    new.notes  := null;

    select count(*) into recent from cresta.enquiries
      where phone = new.phone and created_at > now() - interval '10 minutes';
    if recent >= 3 then
      raise exception 'You have sent several enquiries already. Our team will be in touch shortly.'
        using errcode = 'P0001';
    end if;

    select count(*) into recent from cresta.enquiries
      where created_at > now() - interval '1 minute';
    if recent >= 30 then
      raise exception 'We are receiving a lot of enquiries right now. Please call or WhatsApp us.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function cresta.enquiry_guard() from public, anon, authenticated;

drop trigger if exists enquiry_guard on cresta.enquiries;
create trigger enquiry_guard
  before insert on cresta.enquiries
  for each row execute function cresta.enquiry_guard();
