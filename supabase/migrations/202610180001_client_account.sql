begin;
-- Called only by the authenticated client-portal server after password verification.
create function public.update_client_account(p_client uuid,p_session uuid,p_expected_hash text,
 p_name text,p_phone text,p_country text,p_state text,p_new_hash text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.clients; result jsonb;
begin
 -- Serialize phone changes against manual inserts and other account updates.
 lock table public.clients in share row exclusive mode;
 select * into c from public.clients where id=p_client for update;
 if not found or c.password_hash is distinct from p_expected_hash then
   raise exception 'Account changed. Sign in again and retry.';
 end if;
 perform 1 from public.client_sessions where id=p_session and client_id=p_client and expires_at>now() for update;
 if not found then raise exception 'Your session has expired. Sign in again.'; end if;
 if p_name is null or length(trim(p_name)) not between 2 and 120
 or p_country is null or length(trim(p_country)) not between 2 and 80
 or p_state is null or length(trim(p_state)) not between 2 and 100
 or p_phone is null or p_phone !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'Check your profile details and international phone number.'; end if;
 if p_new_hash is not null and p_new_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$' then raise exception 'Invalid password hash'; end if;
 if p_phone is distinct from c.phone and exists(select 1 from public.clients where id<>p_client
 and right(regexp_replace(phone,'[^0-9]','','g'),10)=right(p_phone,10)) then
   raise exception 'This phone number cannot be used. Contact support.';
 end if;
 update public.clients set full_name=trim(p_name),phone=p_phone,country=trim(p_country),state=trim(p_state),
 password_hash=coalesce(p_new_hash,c.password_hash) where id=p_client;
 if p_new_hash is not null or p_phone is distinct from c.phone then
   delete from public.client_sessions where client_id=p_client and id<>p_session;
 end if;
 select jsonb_build_object('id',id,'full_name',full_name,'phone',phone,'country',country,'state',state,
 'shipping_mark',shipping_mark) into result from public.clients where id=p_client;
 return result;
end $$;
revoke all on function public.update_client_account(uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.update_client_account(uuid,uuid,text,text,text,text,text,text) to service_role;
notify pgrst,'reload schema';
commit;
