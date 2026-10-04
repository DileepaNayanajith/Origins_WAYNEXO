# Auth and production rollout

One common `/#/login` uses exactly Username and Password. Usernames are the existing `app_users.username` values, not employee IDs/email aliases. The backend supplies the role; no client role selector or loader badge bypass exists. Existing loader accounts with null password hashes remain locked until a password is provisioned. No admin role/dashboard exists in this project, so no invented admin access is added.

Required configuration follows existing operations: DRIVER selects an available vehicle in its assigned depot (vehicle also supplies depot); LOADER selects a hub when absent; STORE_MANAGER selects a branch in its assigned depot (branch supplies depot); DISPATCHER is the global control tower and needs no selection. No route assignment field exists on the user; driver trips continue to come from existing backend assignments. Setup options are fetched after authentication, validated against account role/depot on save, and only missing fields can be saved. Operational endpoints reject incomplete setup with 409. Driver offline caches/outboxes are isolated by authenticated user id; old unscoped offline records are retained but never replayed under another account. Empty options show an administrator-contact message. The modal blocks dashboard mounting, supports keyboard focus/native dialog focus trapping, and scrolls on short viewports.

## Why login was returning to login / appearing stuck

The selected Downloads copy lacks fixes already in the existing Git history: forwarded HTTPS handling and reloading the authenticated user inside the current persistence context. Spring sees HTTP behind Railway HTTPS termination without forwarded-header handling, which can reject same-origin browser requests. Detached lazy depot/outlet access can fail after authentication. These fixes are retained. Device-selected login forms also accepted inconsistent credentials, exposed configuration before authentication, and gave loaders a password bypass. API requests had no timeout, blindly accepted HTML success responses, and session restoration cleared tokens on any backend/network failure. The update supplies bounded requests, actionable errors, validated JSON/login responses and preserves tokens on transient restoration failures.

These are source-confirmed defects and regression tests, not a claim that live Railway logs were inspected. No authenticated Railway session or production DB connection was provided.

## Production database cleanup (do this before live writes)

Do NOT set `WAYNEXO_RESEED=true`. Destructive startup reseeding is rejected. Demo seeding is OFF by default (`WAYNEXO_DEMO_SEED=false`) and fresh production databases remain empty until approved real users/master data are imported. Explicit local demos may use `WAYNEXO_DEMO_SEED=true` only on a disposable database; known demo passwords must never be enabled on a publicly reachable production instance.

1. Identify the correct database and pause operational writes. Export a full consistent backup (including schema and data) to a protected location. Test restoring it to an isolated database. Record backup time and database identity.
2. Audit operational records in the restored database. There is no reliable demo provenance column in the current schema; never infer that all rows or all seed-like names are disposable. Prepare a reviewed JSON manifest of exact primary IDs in `exception_reports`, `stop_items`, `trip_stops`, `deferrals`, `order_lines`, `stock_orders`, `trips`, `ops_events`, `planning_conflicts`. Include only confirmed sample records and their confirmed sample children. Omit genuine records. Check every FK referencing selected rows; the database must reject any incomplete dependency list.
3. Generate SQL: `python3 tools/cleanup-demo.py reviewed-demo-ids.json cleanup-review.sql`. Empty lists delete nothing. The tool refuses schema/user/master tables, validates IDs, uses child-before-parent deletion, retains FK checks, records affected counts and always ends in ROLLBACK. It does not connect to the DB or execute anything.
4. Review locked rows/counts and run against the restored backup with a client configured to stop on first error (never use MySQL `--force`). Compare actual affected counts with the manifest. Do not commit if any row, dependency or count differs. Obtain explicit approval for the exact production cleanup after backup/restore validation. Only then apply the reviewed transaction with final COMMIT under paused writes. Backup restore is the recovery path after commit; rollback is available before commit.
5. Preserve `app_users`, roles, depots, outlets, vehicles and products. Audit fake master rows separately: required master data and user references must not be removed by operational cleanup. After removal of demo trips, audit vehicle runtime counters/status (fuel usage, trips today, ON_ROUTE state); reconcile actual fleet state explicitly, never reset genuine counters automatically. No tables, migrations or Git history are dropped.

Example empty manifest:
```json
{"exception_reports":[],"stop_items":[],"trip_stops":[],"deferrals":[],"order_lines":[],"stock_orders":[],"trips":[],"ops_events":[],"planning_conflicts":[]}
```

No existing local database files or live production records were modified by this update. Tests use disposable in-memory H2 fixtures. Without an audited record manifest and production access, actual production cleanup remains a rollout action.

## Users / credentials

Import approved real master data and existing role accounts into a fresh database using reviewed parameterized migrations/imports. Usernames must be unique case-insensitively (audit existing DB duplicates before launch). For existing passwordless loaders, use `python3 tools/user-password.py kasun > loader-password-review.sql`; the password is prompted privately and only PBKDF2 hash is emitted. Review exactly one affected account, then apply in a transaction as above. Assign passwords privately. Do not bulk-reset users or reuse demo passwords. This utility preserves roles/master links and is never run automatically. Changing a password does not revoke already-issued bearer tokens; rotate JWT_SECRET for a planned global session reset if needed.

## Railway configuration / redeploy

- Link persistent MySQL using `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD` (or DB_* / SPRING_DATASOURCE_*). MYSQL_URL is supported. Missing Railway DB now fails clearly rather than silently creating an ephemeral demo DB.
- Set a unique random `JWT_SECRET` with at least 32 characters. Keep it stable across restarts; rotate deliberately to revoke all sessions. Production no longer uses a shared default secret.
- Set `WAYNEXO_DEMO_SEED=false`, `WAYNEXO_RESEED=false`; leave `WAYNEXO_EMBEDDED_DB` unset. Use H2 only for isolated local development/test.
- Docker serves React and API from one origin; leave `VITE_API_URL` unset for `/api`. For a separate frontend, set its build-time VITE_API_URL to the backend origin or full `/api` URL and CORS_ORIGINS to exact frontend HTTPS origins, comma-separated. Vite variables must be set before frontend build. Bearer auth does not use cookies/credentials; allow Authorization on preflight. Never log passwords or tokens.
- Existing `/api/public/login-options` healthcheck remains compatible and now returns only status; role-specific dropdowns are authenticated. After deploy, verify login, `/api/auth/me`, setup and protected API requests in browser Network tab. Same-origin HTTPS needs forwarded-header handling retained in application.yml.
- GitHub push triggers Railway only if the service watches that repo/branch with auto-deploy enabled. Verify the latest commit/deploy and database connection in Railway logs.

## Checks

Backend: `mvn -f backend/pom.xml test` (requires JDK 17+). Frontend: `cd frontend && npm ci && npm run lint && npm test && npm run build`. Browser tests: `npm run test:e2e` start a local Vite server with controlled API fixtures (Chrome required; set CHROME_PATH if needed). Real backend persistence/proxy behavior is tested separately with Spring integration tests. Do not run browser/demo fixtures against production.

Production exposure also requires ingress rate limiting and normal security/monitoring controls; the current update does not add a distributed brute-force limiter.

## Empty-database master bootstrap

For the new persistent Railway database only, set WAYNEXO_MASTER_SEED=true and WAYNEXO_DEMO_SEED=false. Set WAYNEXO_ACCOUNT_PASSWORDS privately to JSON containing distinct passwords (12+ characters each) for harsha, nimal, suresh, kasun, ruwan. Example shape (placeholders only): `{"harsha":"<private password>","nimal":"<private password>","suresh":"<private password>","kasun":"<private password>","ruwan":"<private password>"}`. Password entry is a user handoff; never commit credentials or send them in chat.

This explicit bootstrap reuses the project's existing master datasets and role accounts, hashes private passwords, zeroes demo vehicle runtime counters, preserves workshop status, and creates no orders/trips/stops/events/conflicts/deferrals. It runs in one transaction, rejects partial nonempty databases and skips an already provisioned database without resetting users/passwords. These master datasets still require review for real operations. After successful provisioning, set WAYNEXO_MASTER_SEED=false and remove WAYNEXO_ACCOUNT_PASSWORDS from the app environment. Do not enable demo seeding on the submission/production URL.
