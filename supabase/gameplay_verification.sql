-- Apply before the gameplay function/client. Existing scores remain legacy.
begin;
alter table public.scores add column if not exists verified boolean not null default false;
grant select(verified) on public.scores to anon;
create table if not exists public.game_runs (
 id uuid primary key, token_hash text not null, state jsonb not null,
 revision integer not null default 0, phase text not null default 'play',
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '2 hours'),
 phase_at timestamptz not null default clock_timestamp(), active_seconds double precision not null default 0,
 request_hash text, result jsonb
);
alter table public.game_runs enable row level security;
revoke all on public.game_runs from public,anon,authenticated;
grant select on public.game_runs to service_role;
create index if not exists game_runs_created on public.game_runs(created_at);
create or replace function public.start_game_run(run_id uuid, secret_hash text, initial_state jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(736109205);
 delete from public.game_runs where id in (select id from public.game_runs where expires_at<clock_timestamp() limit 100);
 if (select count(*) from public.game_runs where created_at>clock_timestamp()-interval '1 minute')>=30 then raise exception 'rate_limited'; end if;
 insert into public.game_runs(id,token_hash,state) values(run_id,secret_hash,initial_state);
end; $$;
create or replace function public.commit_game_run(run_id uuid, secret_hash text, expected_revision integer, batch_hash text, next_state jsonb, next_phase text, played_seconds double precision, player_name text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.game_runs%rowtype; budget double precision; answer jsonb;
begin
 select * into r from public.game_runs where id=run_id for update;
 if not found or r.token_hash<>secret_hash or r.expires_at<clock_timestamp() then raise exception 'invalid_run'; end if;
 if r.revision=expected_revision+1 and r.request_hash=batch_hash then return r.result; end if;
 if r.revision<>expected_revision or r.phase='finished' then raise exception 'stale_run'; end if;
 if next_phase not in ('play','pause','finished') or (r.phase='pause' and next_state<>r.state) then raise exception 'invalid_phase'; end if;
 budget:=r.active_seconds;
 if r.phase='play' then budget:=budget+extract(epoch from clock_timestamp()-r.phase_at); end if;
 if played_seconds<0 or played_seconds>budget+3 then raise exception 'too_fast'; end if;
 answer:=jsonb_build_object('ok',true,'revision',r.revision+1);
 if next_phase='finished' then
  if r.phase<>'play' or not (next_state->>'dead')::boolean or (next_state->>'score')::bigint<1 then raise exception 'incomplete_run'; end if;
  perform pg_catalog.pg_advisory_xact_lock(736109204);
  if (select count(*) from public.scores where created_at>clock_timestamp()-interval '1 minute')>=40 then raise exception 'rate_limited'; end if;
  perform pg_catalog.set_config('request.headers','{}',true);
  insert into public.scores(name,score,level,verified) values(player_name,(next_state->>'score')::bigint,(next_state->>'level')::integer,true);
  answer:=answer||jsonb_build_object('score',(next_state->>'score')::bigint,'level',(next_state->>'level')::integer);
 end if;
 update public.game_runs set state=next_state,phase=next_phase,revision=revision+1,request_hash=batch_hash,result=answer,active_seconds=budget,phase_at=clock_timestamp() where id=run_id;
 return answer;
end; $$;
revoke all on function public.start_game_run(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.commit_game_run(uuid,text,integer,text,jsonb,text,double precision,text) from public,anon,authenticated;
grant execute on function public.start_game_run(uuid,text,jsonb) to service_role;
grant execute on function public.commit_game_run(uuid,text,integer,text,jsonb,text,double precision,text) to service_role;
commit;
