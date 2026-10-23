-- RLS continues to restrict client management by staff permissions and
-- settings writes to administrators. Do not grant access to anon.
begin;
alter table public.clients enable row level security;
alter table public.settings enable row level security;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
commit;
