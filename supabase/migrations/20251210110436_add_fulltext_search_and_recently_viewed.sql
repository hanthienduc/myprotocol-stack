-- Enable pg_trgm extension for fuzzy text search
create extension if not exists pg_trgm;

-- Add GIN index for trigram search on protocols
create index idx_protocols_name_trgm on protocols using gin (name gin_trgm_ops);
create index idx_protocols_description_trgm on protocols using gin (description gin_trgm_ops);

-- Add full-text search vector column
alter table protocols add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(science_summary, '')), 'C')
  ) stored;

-- Add GIN index for full-text search
create index idx_protocols_search_vector on protocols using gin (search_vector);

-- Create recently_viewed table for tracking user protocol views
create table if not exists recently_viewed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  protocol_id uuid not null references protocols(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique(user_id, protocol_id)
);

-- Index for efficient querying
create index idx_recently_viewed_user_id on recently_viewed(user_id);
create index idx_recently_viewed_viewed_at on recently_viewed(viewed_at desc);

-- RLS for recently_viewed
alter table recently_viewed enable row level security;

create policy "Users can view own recently viewed"
  on recently_viewed for select
  using (auth.uid() = user_id);

create policy "Users can insert own recently viewed"
  on recently_viewed for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recently viewed"
  on recently_viewed for update
  using (auth.uid() = user_id);

create policy "Users can delete own recently viewed"
  on recently_viewed for delete
  using (auth.uid() = user_id);

-- Function to search protocols with fuzzy matching
create or replace function search_protocols(search_query text)
returns table (
  id uuid,
  name text,
  description text,
  category category,
  difficulty difficulty,
  duration_minutes integer,
  frequency frequency,
  science_summary text,
  steps text[],
  created_at timestamptz,
  relevance float
) as $$
begin
  return query
  select
    p.id,
    p.name,
    p.description,
    p.category,
    p.difficulty,
    p.duration_minutes,
    p.frequency,
    p.science_summary,
    p.steps,
    p.created_at,
    greatest(
      similarity(p.name, search_query),
      similarity(p.description, search_query) * 0.8,
      ts_rank(p.search_vector, plainto_tsquery('english', search_query)) * 0.5
    ) as relevance
  from protocols p
  where
    p.name % search_query
    or p.description % search_query
    or p.search_vector @@ plainto_tsquery('english', search_query)
  order by relevance desc;
end;
$$ language plpgsql;

-- Function to upsert recently viewed (update timestamp if exists)
create or replace function upsert_recently_viewed(p_user_id uuid, p_protocol_id uuid)
returns void as $$
begin
  insert into recently_viewed (user_id, protocol_id, viewed_at)
  values (p_user_id, p_protocol_id, now())
  on conflict (user_id, protocol_id)
  do update set viewed_at = now();
end;
$$ language plpgsql security definer;
