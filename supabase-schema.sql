-- Teams (相手チーム)
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefecture text,
  notes text,
  created_at timestamptz default now()
);

-- Players (選手)
create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  name text not null,
  number text,
  position text,
  photo_url text,
  created_at timestamptz default now()
);

-- Scouting notes (スカウティングノート)
create table scouting_notes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade not null,
  match_date date not null,
  content text not null,
  created_at timestamptz default now()
);

-- Videos (動画)
create table videos (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade not null,
  scouting_note_id uuid references scouting_notes(id) on delete set null,
  title text,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Storage bucket for videos and photos
insert into storage.buckets (id, name, public) values ('scouting-media', 'scouting-media', true);

-- RLS policies (認証なしで全アクセス可能 - チーム内共有前提)
alter table teams enable row level security;
alter table players enable row level security;
alter table scouting_notes enable row level security;
alter table videos enable row level security;

create policy "allow all" on teams for all using (true);
create policy "allow all" on players for all using (true);
create policy "allow all" on scouting_notes for all using (true);
create policy "allow all" on videos for all using (true);

create policy "allow upload" on storage.objects for insert with check (bucket_id = 'scouting-media');
create policy "allow read" on storage.objects for select using (bucket_id = 'scouting-media');
create policy "allow delete" on storage.objects for delete using (bucket_id = 'scouting-media');
