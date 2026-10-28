-- Run ONLY after deploying submit-score, switching config.submissionUrl,
-- and verifying a successful submission through the function.
begin;
revoke insert, update, delete on public.scores from public, anon, authenticated;
-- Table-level REVOKE does not remove existing column grants.
revoke insert (name,score,level) on public.scores from public, anon, authenticated;
drop policy if exists "anyone can add a score" on public.scores;
commit;
