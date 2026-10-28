-- Run against an isolated PostgreSQL test database after the migrations.
begin;
do $$
declare rid uuid:='00000000-0000-4000-8000-000000000099'; s jsonb:='{"dead":false,"score":300,"level":1}'; result jsonb; before_count bigint; active double precision;
begin
 if has_table_privilege('anon','public.game_runs','SELECT') or has_table_privilege('authenticated','public.game_runs','SELECT') or has_function_privilege('anon','public.commit_game_run(uuid,text,integer,text,jsonb,text,double precision,text)','EXECUTE') then raise exception 'public access'; end if;
 perform public.start_game_run(rid,'secret',s);
 begin perform public.commit_game_run(rid,'wrong',0,'one',s,'play',0,null);raise exception 'accepted wrong token';exception when raise_exception then if sqlerrm<>'invalid_run' then raise; end if;end;
 begin perform public.commit_game_run(rid,'secret',0,'one',s,'play',10,null);raise exception 'accepted acceleration';exception when raise_exception then if sqlerrm<>'too_fast' then raise; end if;end;
 perform public.commit_game_run(rid,'secret',0,'pause',s,'pause',0,null);
 update public.game_runs set phase_at=clock_timestamp()-interval '1 hour' where id=rid;
 perform public.commit_game_run(rid,'secret',1,'resume',s,'play',0,null);
 select active_seconds into active from public.game_runs where id=rid;
 if active>2 then raise exception 'pause counted as active';end if;
 begin perform public.commit_game_run(rid,'secret',2,'finish',s,'finished',0,'Verify test');raise exception 'accepted unfinished';exception when raise_exception then if sqlerrm<>'incomplete_run' then raise;end if;end;
 s:=s||'{"dead":true}';select count(*) into before_count from public.scores;
 result:=public.commit_game_run(rid,'secret',2,'finish',s,'finished',0,'Verify test');
 if result<>public.commit_game_run(rid,'secret',2,'finish',s,'finished',0,'Verify test') then raise exception 'retry result mismatch'; end if;
 if (select count(*) from public.scores)<>before_count+1 then raise exception 'duplicate score';end if;
 begin perform public.commit_game_run(rid,'secret',2,'other',s,'finished',0,'Verify test');raise exception 'accepted competing finish';exception when raise_exception then if sqlerrm<>'stale_run' then raise;end if;end;
 update public.game_runs set expires_at=clock_timestamp()-interval '1 second' where id=rid;
 begin perform public.commit_game_run(rid,'secret',2,'finish',s,'finished',0,'Verify test');raise exception 'accepted expired';exception when raise_exception then if sqlerrm<>'invalid_run' then raise;end if;end;
end $$;
rollback;
