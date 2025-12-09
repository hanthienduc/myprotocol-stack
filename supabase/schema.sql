-- MyProtocolStack Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type category as enum ('sleep', 'focus', 'energy', 'fitness');
create type difficulty as enum ('easy', 'medium', 'hard');
create type frequency as enum ('daily', 'weekly');
create type schedule as enum ('daily', 'weekdays', 'weekends', 'custom');
create type subscription_tier as enum ('free', 'pro');

-- Protocols table (pre-populated, read-only for users)
create table protocols (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  category category not null,
  difficulty difficulty not null default 'medium',
  duration_minutes integer,
  frequency frequency not null default 'daily',
  science_summary text,
  steps text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Profiles table (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  subscription_tier subscription_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stacks table (user-created protocol combinations)
create table stacks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  protocol_ids uuid[] not null default '{}',
  schedule schedule not null default 'daily',
  custom_days integer[], -- 0=Sun, 1=Mon, etc.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tracking table (daily completion records)
create table tracking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  stack_id uuid not null references stacks(id) on delete cascade,
  protocol_id uuid not null references protocols(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, stack_id, protocol_id, date)
);

-- Indexes
create index idx_stacks_user_id on stacks(user_id);
create index idx_tracking_user_id on tracking(user_id);
create index idx_tracking_date on tracking(date);
create index idx_tracking_user_date on tracking(user_id, date);
create index idx_protocols_category on protocols(category);

-- RLS Policies
alter table protocols enable row level security;
alter table profiles enable row level security;
alter table stacks enable row level security;
alter table tracking enable row level security;

-- Protocols: anyone can read
create policy "Protocols are viewable by everyone"
  on protocols for select
  using (true);

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Stacks: users can CRUD their own
create policy "Users can view own stacks"
  on stacks for select
  using (auth.uid() = user_id);

create policy "Users can create own stacks"
  on stacks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own stacks"
  on stacks for update
  using (auth.uid() = user_id);

create policy "Users can delete own stacks"
  on stacks for delete
  using (auth.uid() = user_id);

-- Tracking: users can CRUD their own
create policy "Users can view own tracking"
  on tracking for select
  using (auth.uid() = user_id);

create policy "Users can create own tracking"
  on tracking for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracking"
  on tracking for update
  using (auth.uid() = user_id);

create policy "Users can delete own tracking"
  on tracking for delete
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stacks_updated_at
  before update on stacks
  for each row execute procedure update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();
