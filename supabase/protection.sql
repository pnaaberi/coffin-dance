-- Coffin Dance: anti-spam and anti-cheat rules for the scores table.
-- Run in Supabase > SQL Editor after schema.sql (and name_filter.sql). Safe to run again.

-- 1. Room for big scores: the combo multiplier makes good runs grow fast.
alter table public.scores alter column score type bigint;
alter table public.scores drop constraint if exists scores_score_check;

-- 2. Score sanity: no score above what flawless play could reach by that level
--    (at most 300 notes per level, 300 points per note, combo multiplier +1 per 10 hits).
alter table public.scores drop constraint if exists scores_score_plausible;
alter table public.scores add constraint scores_score_plausible check (
  score >= 1 and score <= 300::bigint * ((level * 300)::bigint + (level * 300)::bigint * (level * 300) / 20)
) not valid;

-- 3. Rate limits, using a one-way hash of the player's IP address (the IP itself is never stored).
alter table public.scores add column if not exists client_hash text;
create index if not exists scores_created_idx on public.scores (created_at);
create index if not exists scores_client_idx on public.scores (client_hash, created_at);

create or replace function public.scores_guard()
returns trigger language plpgsql security definer set search_path = '' as $fn$
declare
  hdr json := nullif(current_setting('request.headers', true), '')::json;
  ip  text := coalesce(hdr->>'cf-connecting-ip', hdr->>'x-real-ip', split_part(hdr->>'x-forwarded-for', ',', 1), '');
begin
  new.created_at  := now();                         -- players can't fake the time
  new.client_hash := case when ip = '' then null else md5(ip || ':coffin-dance-scores') end;

  -- max 3 scores per minute from the same connection
  if new.client_hash is not null and (
       select count(*) from public.scores
       where client_hash = new.client_hash and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'rate_limited' using hint = 'Too many scores from you, wait a minute.';
  end if;

  -- max 40 scores per minute in total (stops floods from many addresses)
  if (select count(*) from public.scores where created_at > now() - interval '1 minute') >= 40 then
    raise exception 'rate_limited' using hint = 'The board is busy, try again in a minute.';
  end if;

  return new;
end $fn$;
-- Trigger execution needs no public RPC permission.
revoke all on function public.scores_guard() from public, anon, authenticated;

drop trigger if exists scores_guard on public.scores;
create trigger scores_guard before insert on public.scores
  for each row execute function public.scores_guard();

-- 4. The public key may only read name/score/level/time and only write name/score/level.
--    (client_hash stays private; created_at is always set by the database.)
revoke all on public.scores from public, anon;
revoke all on public.scores from authenticated;   -- signed-in users get no extra rights either
grant select (name, score, level, created_at) on public.scores to anon;
grant insert (name, score, level) on public.scores to anon;

-- 5. Keep the table small: drop rows that are far below the top 10 and older than 30 days.
create or replace function public.scores_tidy() returns void language sql security definer set search_path = '' as $fn$
  delete from public.scores
  where created_at < now() - interval '30 days'
    and id not in (select id from public.scores order by score desc limit 100);
$fn$;
-- Only the function owner/admin may run this deletion routine (including via cron).
revoke all on function public.scores_tidy() from public, anon, authenticated;
-- Optional: run it daily with Supabase's pg_cron (Database > Extensions > enable pg_cron), then:
-- select cron.schedule('tidy-scores', '17 3 * * *', 'select public.scores_tidy()');
