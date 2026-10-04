# WAYNEXO — delivery operations

Public deployment: https://waynexo-production.up.railway.app/#/login

One Username/Password login derives the account role from MySQL. Dispatcher uses the TV control tower, Driver the mobile app, Store Manager the desktop/phone console and Loader the tablet/phone dock app. Frontend routes and backend endpoints enforce roles; drivers own their trips and loaders are restricted to their depot. Login appearance is preserved.

## Run the complete local stack

Install Docker Desktop, then from the repository root:

```sh
docker compose up --build
```

Open http://localhost:8080/#/login. MySQL health checks run before the application starts. `.env.example` documents optional local port/database/JWT settings. The defaults are for isolated development only. The empty local database imports the organiser's 120 outlets, 60 vehicles and two depots plus 200 synthetic orders forming an overcapacity planning scenario. Existing data is never reset on restart.

Local seeded accounts (these are not the private Railway passwords):

| Role | Username | Local password |
|---|---|---|
| Dispatcher | harsha | dispatch123 |
| Driver | suresh | driver123 |
| Store Manager | nimal | store123 |
| Loader, Peliyagoda | kasun | demo-loader123 |
| Loader, Kandy | ruwan | demo-loader123 |

Suresh drives VEH004; Nimal manages OUT004. Other fleet driver profiles have no password, so they cannot authenticate until separately provisioned. There is no admin dashboard/account in this application.

## Judge walkthrough

1. Store: sign in as nimal. Add a chilled item and an ambient item, choose an operating delivery date and place the cart. The confirmation shows two order codes. Check Order History.
2. Dispatcher: sign in as harsha. Confirm those pending orders. Select Trip 1, select an order and click VEH004 (or drag onto it). Repeat for the other order. The constraints verify home depot, brand/district, temperature, van access, whole-order weight/volume, time/window and weekly fuel. Select **Release plan to dock**. The created trip now appears in the loader queue and driver app. Use Auto-allocate on the larger local scenario to demonstrate prioritisation and unavoidable deferrals, or deliberately attempt an incompatible vehicle and show the error. Deferring a selected order requires a reason and note.
3. Loader: sign in as kasun. Open the released VEH004 manifest. Load in reverse stop order. Enter each loaded quantity and condition. For one item, load one fewer and flag the shortfall; then verify. Mark refrigerated compartments pre-cooled. Dispatch after all stops are verified.
4. Driver: sign in as suresh. Start the dock-released run. Open each current stop, mark arrival, record recipient/signature and submit POD. Demonstrate one POD or exception with connectivity off, then reconnect and sync the offline queue. Duplicate POD replay does not create another completion.
5. Store: return to nimal. Delivery Schedule shows the planned stop ETA and reports lateness instead of a false 'arriving now' claim. Receive Shipment remains available after driver POD until a signed store receipt is saved. Enter actual quantities/conditions and confirm. Show the deferral alert for a separate deferred order.
6. Route protection: manually attempt another role's URL; it redirects to the account's own app. The backend independently returns 403 for a wrong-role request.

A mobile browser can test Driver, Loader and Store. Dispatcher is optimised for a widescreen TV. Operational dates are in Asia/Colombo. The local seeded scenario starts on the next operating day; the walkthrough can act on a released scheduled run without changing the device clock.

## Development and tests

Java 17+, Maven and Node 22 are used by the Docker build. For separate development, start MySQL, supply a private JWT_SECRET and database settings, run the backend with Maven and run `npm ci` / `npm run dev` in frontend. Vite proxies `/api` to port 8080; the packaged frontend and backend share the same origin.

```sh
cd backend
mvn test
cd ../frontend
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser contract tests use controlled API fixtures. Spring integration tests cover real database authentication/persistence and the released order-to-receipt workflow. The browser tests require Chrome (override CHROME_PATH if needed). Docker validation covers the packaged app with MySQL.

## Railway configuration

Keep the existing persistent MYSQL_URL and a strong JWT_SECRET. Existing WAYNEXO_ACCOUNT_PASSWORDS values are private and should not be committed. With an already populated database keep WAYNEXO_DEMO_SEED, WAYNEXO_MASTER_SEED and WAYNEXO_RESEED false. Production is not populated with the local synthetic scenario. Deployment uses the root Dockerfile and listens on injected PORT. `/api/health` is the readiness check; role login and database reads must also be verified after a deployment.

See [safe data cleanup and import](docs/DATA-CLEANUP.md) before production maintenance. Maintenance endpoints are disabled by default and enabled only during the backed-up one-time official master import. Disable them immediately afterwards.

## Documentation and departures

- [Architecture and data model](docs/ARCHITECTURE.md)
- [AI disclosure](docs/AI-DISCLOSURE.md)
- [Dataset provenance](docs/DATASET-PROVENANCE.md)
- [Safe maintenance](docs/DATA-CLEANUP.md)

Compared with the original design-based implementation, the delivered flow uses one account-derived login, protected routes, explicit constrained plan release, separated ambient/chilled orders, official master data, calculated ETAs/fuel/time budgets and phone reflow for Store/Loader. Invented weather alerts and decorative phone status bars were removed. These are implementation departures; no unprovided Designathon submission is represented as verified.

For submission, organisers require a monorepo named `TeamName_SolutionName`, a public URL with four role credentials and a 5–8 minute unlisted YouTube walkthrough. The current repository is `waynexo`; the team must confirm its official team name and submission repository naming. Supply Railway judge credentials privately in the submission form rather than publishing deployment secrets here.
