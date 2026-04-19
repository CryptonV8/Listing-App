create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint user_roles_user_role_unique unique (user_id, role),
  constraint user_roles_role_check check (role in ('admin'))
);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
create index if not exists user_roles_role_idx on public.user_roles (role);

alter table public.user_roles enable row level security;

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = check_user_id
      and ur.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- user_roles policies (additive, isolated from existing owner policies)
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
  on public.user_roles
  for select
  using (
    auth.uid() = user_id
    or public.is_admin(auth.uid())
  );

drop policy if exists "user_roles_admin_manage" on public.user_roles;
create policy "user_roles_admin_manage"
  on public.user_roles
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- listings: keep owner policies, add admin extensions
drop policy if exists "listings_admin_select_all" on public.listings;
create policy "listings_admin_select_all"
  on public.listings
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "listings_admin_update_all" on public.listings;
create policy "listings_admin_update_all"
  on public.listings
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "listings_admin_delete_all" on public.listings;
create policy "listings_admin_delete_all"
  on public.listings
  for delete
  using (public.is_admin(auth.uid()));

-- listing_photos: keep owner policies, add admin extensions
drop policy if exists "listing_photos_admin_select_all" on public.listing_photos;
create policy "listing_photos_admin_select_all"
  on public.listing_photos
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "listing_photos_admin_insert_all" on public.listing_photos;
create policy "listing_photos_admin_insert_all"
  on public.listing_photos
  for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "listing_photos_admin_update_all" on public.listing_photos;
create policy "listing_photos_admin_update_all"
  on public.listing_photos
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "listing_photos_admin_delete_all" on public.listing_photos;
create policy "listing_photos_admin_delete_all"
  on public.listing_photos
  for delete
  using (public.is_admin(auth.uid()));

-- user_profiles: keep owner policies, add admin visibility + limited update
drop policy if exists "user_profiles_admin_select_all" on public.user_profiles;
create policy "user_profiles_admin_select_all"
  on public.user_profiles
  for select
  using (public.is_admin(auth.uid()));

drop policy if exists "user_profiles_admin_update_all" on public.user_profiles;
create policy "user_profiles_admin_update_all"
  on public.user_profiles
  for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- storage objects: allow admin to manage files in listing-photos bucket
drop policy if exists "listing_photos_bucket_admin_update" on storage.objects;
create policy "listing_photos_bucket_admin_update"
  on storage.objects
  for update
  using (
    bucket_id = 'listing-photos'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'listing-photos'
    and public.is_admin(auth.uid())
  );

drop policy if exists "listing_photos_bucket_admin_delete" on storage.objects;
create policy "listing_photos_bucket_admin_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'listing-photos'
    and public.is_admin(auth.uid())
  );
