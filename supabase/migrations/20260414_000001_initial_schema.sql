create extension if not exists pgcrypto with schema extensions;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  location text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listings_owner_id_created_at_idx on public.listings (owner_id, created_at desc);
create index if not exists listing_photos_listing_id_display_order_idx on public.listing_photos (listing_id, display_order);
create index if not exists user_profiles_email_idx on public.user_profiles (email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
begin
  profile_name := nullif(new.raw_user_meta_data->>'name', '');

  insert into public.user_profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(profile_name, ''),
    coalesce(new.email, ''),
    new.phone
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = excluded.phone,
        name = coalesce(nullif(excluded.name, ''), public.user_profiles.name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.sync_user_profile();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update on auth.users
for each row
execute function public.sync_user_profile();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "user_profiles_delete_own" on public.user_profiles;
create policy "user_profiles_delete_own"
  on public.user_profiles
  for delete
  using (auth.uid() = id);

drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public"
  on public.listings
  for select
  using (true);

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own"
  on public.listings
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own"
  on public.listings
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own"
  on public.listings
  for delete
  using (auth.uid() = owner_id);

drop policy if exists "listing_photos_select_public" on public.listing_photos;
create policy "listing_photos_select_public"
  on public.listing_photos
  for select
  using (true);

drop policy if exists "listing_photos_insert_own_listing" on public.listing_photos;
create policy "listing_photos_insert_own_listing"
  on public.listing_photos
  for insert
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "listing_photos_update_own_listing" on public.listing_photos;
create policy "listing_photos_update_own_listing"
  on public.listing_photos
  for update
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_photos.listing_id
        and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.owner_id = auth.uid()
    )
  );

drop policy if exists "listing_photos_delete_own_listing" on public.listing_photos;
create policy "listing_photos_delete_own_listing"
  on public.listing_photos
  for delete
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.owner_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update
  set name = excluded.name,
      public = excluded.public;

drop policy if exists "listing_photos_bucket_public_select" on storage.objects;
create policy "listing_photos_bucket_public_select"
  on storage.objects
  for select
  using (bucket_id = 'listing-photos');

drop policy if exists "listing_photos_bucket_authenticated_insert" on storage.objects;
create policy "listing_photos_bucket_authenticated_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.role() = 'authenticated'
    and owner = auth.uid()
  );

drop policy if exists "listing_photos_bucket_owner_update" on storage.objects;
create policy "listing_photos_bucket_owner_update"
  on storage.objects
  for update
  using (
    bucket_id = 'listing-photos'
    and owner = auth.uid()
  )
  with check (
    bucket_id = 'listing-photos'
    and owner = auth.uid()
  );

drop policy if exists "listing_photos_bucket_owner_delete" on storage.objects;
create policy "listing_photos_bucket_owner_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'listing-photos'
    and owner = auth.uid()
  );
