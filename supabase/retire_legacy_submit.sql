-- Apply only after the verified gameplay client and function are tested.
-- Never restore public table inserts as a rollback.
begin;
revoke execute on function public.submit_guarded_score(text,bigint,integer) from service_role;
commit;
