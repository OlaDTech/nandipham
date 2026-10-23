-- Table privileges are required in addition to the existing RLS policies.
-- Own-profile reads and administrator writes remain governed by RLS.
begin;
alter table public.profiles enable row level security;
grant usage on schema public to authenticated;
grant select, insert, update on table public.profiles to authenticated;
commit;
