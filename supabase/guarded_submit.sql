-- Install BEFORE deploying the function. Does not disable the existing client.
begin;
create or replace function public.submit_guarded_score(player_name text, player_score bigint, player_level integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Serialize submissions across every Edge Function instance. Count and insert
  -- stay in one transaction; failures roll back and release the lock.
  perform pg_catalog.pg_advisory_xact_lock(736109204);
  if (select count(*) from public.scores where created_at > clock_timestamp() - interval '1 minute') >= 40 then
    raise exception 'rate_limited';
  end if;
  insert into public.scores(name, score, level) values (player_name, player_score, player_level);
end;
$$;
revoke all on function public.submit_guarded_score(text,bigint,integer) from public, anon, authenticated;
grant execute on function public.submit_guarded_score(text,bigint,integer) to service_role;
commit;
