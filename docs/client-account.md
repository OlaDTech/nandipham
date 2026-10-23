# Client account editing

Clients open More → Account & security to edit their name, phone, country,
state and password. The shipping mark and financial records are not editable.
All saves require the current password. New passwords require at least ten
characters and at most 72 UTF-8 bytes (bcrypt limit). Passwords are never stored
in browser profile storage or returned by the account API.

Phone numbers use international format (+country code). This does not verify
ownership of the number by SMS. The current password authorizes the change.
Duplicate checks follow the existing registration policy (last ten digits).

The secure client session determines the account, never a browser-supplied ID.
Five update attempts per account per hour are allowed using the existing
server-only rate limiter. The database transaction rechecks the session and
verified password hash to prevent stale concurrent updates. Phone/password
changes revoke other sessions; the current device stays signed in. Revoked
sessions' push subscriptions are removed by the existing foreign key cascade.

## Deployment order

1. Apply `supabase/migrations/202610180001_client_account.sql` after registration
   and the existing client-session schema.
2. Deploy `client-portal` with the existing `verify_jwt = false` setting. The
   function verifies opaque client sessions itself; do not remove that check.
3. Publish the frontend.

Tests: `node tests/client-account-db.mjs`, `node tests/client-account-ui.mjs`
(mock Vite server at port 5175), and
`npx deno run --allow-env --no-lock --node-modules-dir=none tests/client-account-api.ts`.
