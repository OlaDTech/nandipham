-- Receipt generation uses an invoker function, so callers need nextval access.
begin;
grant usage on sequence public.receipt_no_seq to authenticated, service_role;
commit;
