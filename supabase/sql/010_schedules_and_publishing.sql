-- Core schedule storage tables, publish tables, and public subscriptions.

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  format text not null,
  status text not null default 'draft' check (status in ('draft', 'generated', 'archived')),
  current_revision_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz null
);

create table if not exists public.schedule_revisions (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  source text not null check (source in ('home_generate', 'results_regenerate', 'manual_save', 'import_local')),
  input_json jsonb not null,
  schedule_json jsonb null,
  summary_json jsonb null,
  seed integer null,
  generation_elapsed_ms integer null,
  generated_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint schedule_revisions_schedule_id_revision_number_key unique (schedule_id, revision_number)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schedules_current_revision_id_fkey'
      and conrelid = 'public.schedules'::regclass
  ) then
    alter table public.schedules
      add constraint schedules_current_revision_id_fkey
      foreign key (current_revision_id)
      references public.schedule_revisions (id)
      on delete set null;
  end if;
end
$$;

create index if not exists schedules_user_updated_idx
  on public.schedules (user_id, updated_at desc);

create index if not exists schedules_user_status_idx
  on public.schedules (user_id, status);

create index if not exists schedule_revisions_schedule_created_idx
  on public.schedule_revisions (schedule_id, created_at desc);

create index if not exists schedule_revisions_user_schedule_idx
  on public.schedule_revisions (user_id, schedule_id);

drop trigger if exists set_updated_at_schedules on public.schedules;
create trigger set_updated_at_schedules
before update on public.schedules
for each row
execute function public.set_updated_at();

create table if not exists public.published_schedules (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  revision_id uuid not null references public.schedule_revisions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  title text not null,
  league_name text null,
  league_description text null,
  format text not null,
  input_json jsonb not null,
  schedule_json jsonb not null,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_schedules_schedule_id_key unique (schedule_id),
  constraint published_schedules_slug_key unique (slug)
);

create index if not exists published_schedules_user_idx
  on public.published_schedules (user_id, updated_at desc);

create index if not exists published_schedules_active_slug_idx
  on public.published_schedules (is_active, slug);

drop trigger if exists set_updated_at_published_schedules on public.published_schedules;
create trigger set_updated_at_published_schedules
before update on public.published_schedules
for each row
execute function public.set_updated_at();

create table if not exists public.public_schedule_subscriptions (
  id uuid primary key default gen_random_uuid(),
  published_schedule_id uuid not null references public.published_schedules (id) on delete cascade,
  email text null,
  phone text null,
  delivery_channel text not null check (delivery_channel in ('email', 'sms')),
  team_id text null,
  team_scope text not null default '__all__',
  created_at timestamptz not null default now(),
  check (
    (delivery_channel = 'email' and email is not null and phone is null)
    or
    (delivery_channel = 'sms' and phone is not null and email is null)
  )
);

create index if not exists public_schedule_subscriptions_published_idx
  on public.public_schedule_subscriptions (published_schedule_id);

create unique index if not exists public_schedule_subscriptions_email_unique_idx
  on public.public_schedule_subscriptions (published_schedule_id, team_scope, delivery_channel, lower(email))
  where delivery_channel = 'email';

create unique index if not exists public_schedule_subscriptions_sms_unique_idx
  on public.public_schedule_subscriptions (published_schedule_id, team_scope, delivery_channel, phone)
  where delivery_channel = 'sms';

alter table public.schedules enable row level security;
alter table public.schedule_revisions enable row level security;
alter table public.published_schedules enable row level security;
alter table public.public_schedule_subscriptions enable row level security;

drop policy if exists schedules_owner_all on public.schedules;
create policy schedules_owner_all
on public.schedules
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists schedule_revisions_owner_all on public.schedule_revisions;
create policy schedule_revisions_owner_all
on public.schedule_revisions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists published_schedules_owner_select on public.published_schedules;
create policy published_schedules_owner_select
on public.published_schedules
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists published_schedules_owner_insert on public.published_schedules;
create policy published_schedules_owner_insert
on public.published_schedules
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists published_schedules_owner_update on public.published_schedules;
create policy published_schedules_owner_update
on public.published_schedules
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists published_schedules_owner_delete on public.published_schedules;
create policy published_schedules_owner_delete
on public.published_schedules
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists published_schedules_public_read_active on public.published_schedules;
create policy published_schedules_public_read_active
on public.published_schedules
for select
to anon, authenticated
using (is_active = true);

drop policy if exists public_schedule_subscriptions_owner_select on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_owner_select
on public.public_schedule_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.published_schedules ps
    where ps.id = published_schedule_id
      and ps.user_id = auth.uid()
  )
);

drop policy if exists public_schedule_subscriptions_owner_delete on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_owner_delete
on public.public_schedule_subscriptions
for delete
to authenticated
using (
  exists (
    select 1
    from public.published_schedules ps
    where ps.id = published_schedule_id
      and ps.user_id = auth.uid()
  )
);

drop policy if exists public_schedule_subscriptions_public_insert on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_public_insert
on public.public_schedule_subscriptions
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.published_schedules ps
    where ps.id = published_schedule_id
      and ps.is_active = true
  )
);

drop policy if exists public_schedule_subscriptions_sms_public_select on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_sms_public_select
on public.public_schedule_subscriptions
for select
to anon, authenticated
using (delivery_channel = 'sms');

drop policy if exists public_schedule_subscriptions_sms_public_delete on public.public_schedule_subscriptions;
create policy public_schedule_subscriptions_sms_public_delete
on public.public_schedule_subscriptions
for delete
to anon, authenticated
using (delivery_channel = 'sms');
