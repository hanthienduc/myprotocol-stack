-- Add tags column to protocols (array of strings for flexibility)
alter table protocols add column if not exists tags text[] not null default '{}';

-- Create index for tag queries
create index idx_protocols_tags on protocols using gin (tags);

-- Predefined tags to add to protocols
-- These will be populated via a separate seed update

-- Create saved_filter_presets table for user-saved searches
create table if not exists saved_filter_presets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}',
  sort_field text,
  sort_order text default 'asc',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_saved_filter_presets_user_id on saved_filter_presets(user_id);

-- RLS for saved_filter_presets
alter table saved_filter_presets enable row level security;

create policy "Users can view own saved presets"
  on saved_filter_presets for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved presets"
  on saved_filter_presets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved presets"
  on saved_filter_presets for update
  using (auth.uid() = user_id);

create policy "Users can delete own saved presets"
  on saved_filter_presets for delete
  using (auth.uid() = user_id);

-- Trigger to update updated_at
create trigger saved_filter_presets_updated_at
  before update on saved_filter_presets
  for each row execute procedure update_updated_at();

-- Function to find similar protocols based on category, difficulty, and tags
create or replace function find_similar_protocols(
  p_protocol_id uuid,
  p_limit integer default 3
)
returns table (
  id uuid,
  name text,
  description text,
  category category,
  difficulty difficulty,
  duration_minutes integer,
  frequency frequency,
  tags text[],
  similarity_score integer
) as $$
declare
  v_category category;
  v_difficulty difficulty;
  v_tags text[];
  v_duration integer;
begin
  -- Get the source protocol's attributes
  select p.category, p.difficulty, p.tags, p.duration_minutes
  into v_category, v_difficulty, v_tags, v_duration
  from protocols p
  where p.id = p_protocol_id;

  return query
  select
    p.id,
    p.name,
    p.description,
    p.category,
    p.difficulty,
    p.duration_minutes,
    p.frequency,
    p.tags,
    -- Calculate similarity score (higher = more similar)
    (
      case when p.category = v_category then 3 else 0 end +
      case when p.difficulty = v_difficulty then 2 else 0 end +
      case when p.duration_minutes is not null and v_duration is not null
           and abs(p.duration_minutes - v_duration) <= 15 then 1 else 0 end +
      coalesce(array_length(array(select unnest(p.tags) intersect select unnest(v_tags)), 1), 0)
    ) as similarity_score
  from protocols p
  where p.id != p_protocol_id
  order by similarity_score desc, p.name asc
  limit p_limit;
end;
$$ language plpgsql;

-- Update protocols with tags based on their characteristics
-- Morning-related
update protocols set tags = array_append(tags, 'morning')
where name ilike '%morning%' or name ilike '%wake%' or description ilike '%first hour%';

-- Evening/Night-related
update protocols set tags = array_append(tags, 'evening')
where name ilike '%evening%' or name ilike '%night%' or name ilike '%sleep%' or category = 'sleep';

-- Quick protocols (<15 min)
update protocols set tags = array_append(tags, 'quick')
where duration_minutes is not null and duration_minutes <= 15;

-- Science-backed (has science summary)
update protocols set tags = array_append(tags, 'science-backed')
where science_summary is not null and science_summary != '';

-- Beginner-friendly
update protocols set tags = array_append(tags, 'beginner-friendly')
where difficulty = 'easy';

-- Advanced
update protocols set tags = array_append(tags, 'advanced')
where difficulty = 'hard';

-- No equipment needed (based on common patterns)
update protocols set tags = array_append(tags, 'no-equipment')
where name ilike '%sunlight%' or name ilike '%breathing%' or name ilike '%walk%'
   or name ilike '%meditation%' or name ilike '%fasting%';

-- Outdoor
update protocols set tags = array_append(tags, 'outdoor')
where name ilike '%sunlight%' or name ilike '%walk%' or name ilike '%outdoor%'
   or description ilike '%outside%';

-- Remove duplicates from tags
update protocols set tags = (
  select array_agg(distinct t)
  from unnest(tags) as t
);
