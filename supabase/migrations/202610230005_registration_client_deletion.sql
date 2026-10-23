-- Keep reviewed applications as history when their client is removed.
begin;
alter table public.client_registrations
  drop constraint client_registrations_client_id_fkey;
alter table public.client_registrations
  add constraint client_registrations_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete set null;
commit;
