-- Coffin Dance: shared high-score table
-- Paste into Supabase > SQL Editor > New query, and press Run.

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  name        text        not null check (char_length(name) between 1 and 16),
  score       integer     not null check (score between 1 and 5000000),
  level       integer     not null check (level between 1 and 200),
  created_at  timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc);

-- Row Level Security: anyone may read the board and add a score,
-- nobody (with the public key) may edit or delete existing rows.
alter table public.scores enable row level security;

drop policy if exists "anyone can read scores" on public.scores;
create policy "anyone can read scores" on public.scores
  for select to anon using (true);

drop policy if exists "anyone can add a score" on public.scores;
create policy "anyone can add a score" on public.scores
  for insert to anon with check (true);

grant select, insert on public.scores to anon;
