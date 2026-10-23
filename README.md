# NandiphaM

Independent pink-themed logistics and shopping portal. No customer data,
credentials, Git history, Supabase project link or hosting account was copied.

Destination: Botswana. Local currency: Botswana pula (BWP). China sourcing uses
RMB as before. City/district is stored in the existing `state` database field.
Freight rates are intentionally blank: configure Botswana prices before use;
the previous country's amounts have not been converted or reused.

## Local preview

Run `npm ci`, then `npm run dev` in this folder (port 5176 is configured).
Open http://localhost:5176. Public pages work before database setup.
Private features require your own Supabase project; there is no shared backend.

## Connect Supabase later

1. Create a NEW Supabase project.
2. Copy `.env.example` to `.env.local` and fill in its URL and public anon key.
   Never put service-role secrets in VITE variables.
3. Review and apply `supabase_schema.sql`, then migrations in filename order.
4. Deploy the included Edge Functions to YOUR project ref, using the auth
   configuration in `supabase/config.toml`.
5. Create the owner's Supabase Auth user and matching admin profile using the
   schema instructions. No admin account/password is provided in this copy.
6. Set real company contacts, warehouse addresses, rates, payment instructions
   and destinations. Warehouse defaults are blank; review inherited route copy.
7. Restart Vite after changing environment variables.

For push, generate NEW VAPID keys and a worker secret. Configure your own Vault
values before applying optional `supabase/push-schedule.sql`.
See `docs/web-push.md` and the feature docs.

## Publishing

`npm run build` produces `dist`. Create a separate Git repository and hosting
project with its own environment variables. No deployment remote is linked.

This copy retains the admin/staff tools, client portal, labels, cargo, shipments,
finance, shop, chat, notifications, registration and account editing source.
Database-dependent workflows must be tested after connecting the new project.

Built with React, Vite and Supabase. Brand styles are in the CSS palette and
`src/styles/nandipham-theme.css`; logo assets are local SVG files.
