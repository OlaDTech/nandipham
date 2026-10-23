-- Explicit privileges for projects without automatic public-schema grants.
-- Existing RLS policies continue to enforce roles and staff permissions.
begin;
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'announcements','containers','expenses','goods','messages',
    'purchase_requests','receipts','scan_logs','suppliers'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

-- Wallet balance changes are made through validated RPCs, not direct writes.
grant select on public.wallet_accounts, public.wallet_transactions to authenticated;
grant select, update on public.store_orders to authenticated;
grant select on public.receipt_deletion_audit to authenticated;
grant select on public.store_products to anon, authenticated;
grant insert, update, delete on public.store_products to authenticated;

-- Do not expose registration password hashes to the browser.
grant select(id,full_name,phone,country,state,status,client_id,reviewed_by,reviewed_at,created_at)
  on public.client_registrations to authenticated;

-- Only trusted server functions use service_role; it is never a browser key.
grant usage on schema public to service_role;
grant select, insert, update, delete on
  public.profiles, public.clients, public.goods, public.containers,
  public.receipts, public.expenses, public.announcements, public.suppliers,
  public.messages, public.purchase_requests, public.wallet_accounts,
  public.wallet_transactions, public.client_sessions, public.scan_logs,
  public.settings, public.store_products, public.store_orders,
  public.receipt_deletion_audit, public.client_registrations,
  public.registration_rate_limits, public.client_presence,
  public.push_subscriptions, public.push_deliveries
to service_role;
commit;
