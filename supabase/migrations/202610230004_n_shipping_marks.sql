-- Shared atomic sequence for manual clients and approved registrations.
begin;
create sequence if not exists public.shipping_mark_seq start with 100001;
do $$
declare highest bigint;
begin
 select max(substring(shipping_mark from 2)::bigint) into highest
 from public.clients where shipping_mark ~ '^N[0-9]+$';
 if highest is not null and highest >= (select last_value from public.shipping_mark_seq) then
  perform setval('public.shipping_mark_seq', highest, true);
 end if;
end $$;
create or replace function public.generate_shipping_mark(client_name text)
returns text language plpgsql security definer set search_path = public as $$
declare candidate text;
begin
 if auth.uid() is null or not public.has_permission('clients') then
  raise exception 'Client management permission required' using errcode='42501';
 end if;
 loop
  candidate := 'N' || nextval('public.shipping_mark_seq')::text;
  exit when not exists(select 1 from public.clients where shipping_mark=candidate);
 end loop;
 return candidate;
end;
$$;
revoke all on function public.generate_shipping_mark(text) from public, anon;
grant execute on function public.generate_shipping_mark(text) to authenticated;
create or replace function public.review_client_registration(p_id uuid,p_approve boolean) returns uuid
language plpgsql security definer set search_path=public as $$
declare r public.client_registrations; v_client uuid; v_mark text; v_seq text;
begin
 if auth.uid() is null or public.get_my_role() is distinct from 'admin' then raise exception 'Only administrators can review registrations' using errcode='42501'; end if;
 if p_approve is null then raise exception 'Choose approve or reject'; end if;
 select * into r from client_registrations where id=p_id for update;
 if not found or r.status<>'pending' then raise exception 'This request has already been reviewed or no longer exists'; end if;
 if p_approve then
   -- Serialize with manual customer inserts while checking existing phone records.
   lock table public.clients in share row exclusive mode;
   if exists(select 1 from clients where right(regexp_replace(phone,'[^0-9]','','g'),10)=right(r.phone,10)) then
     raise exception 'An existing customer uses this phone. Reject this request and help them access their existing account.';
   end if;
   v_mark := public.generate_shipping_mark(r.full_name);
   insert into clients(full_name,phone,country,state,password_hash,shipping_mark,created_by)
   values(r.full_name,r.phone,r.country,r.state,r.password_hash,v_mark,auth.uid()) returning id into v_client;
 end if;
 update client_registrations set status=case when p_approve then 'approved' else 'rejected' end,
 password_hash=null,client_id=v_client,reviewed_by=auth.uid(),reviewed_at=now() where id=p_id;
 return v_client;
end $$;
commit;
