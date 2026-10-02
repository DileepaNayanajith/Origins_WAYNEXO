# WAYNEXO — Role-based Delivery Operations Platform

Working site built from the **WAYNEXO Figma** (Dispatcher TV, Store Manager MacBook, Driver iPhone, Loader iPad).
**Frontend:** React 19 + Vite + Tailwind CSS 4 · **Backend:** Spring Boot 3 (Java 17) · **Database:** MySQL 8 (or H2 for a quick demo)

Workflow covered end-to-end: **Plan → Prepare → Deliver → Receive**

```
Store Manager places order ─► Dispatcher confirms & allocates (constraint-checked)
        ▲                               │
        │                               ▼
Store receives & signs ◄── Driver delivers (POD, offline queue) ◄── Loader verifies & dispatches
```

---

## 1. Quick start (මුලින්ම run කරන්න)

### Prerequisites
- **Java 17+** and **Maven** (or use VS Code "Extension Pack for Java")
- **Node.js 20+**
- **MySQL 8** — optional (use the H2 profile or `docker compose up -d` instead)

### Backend (Spring Boot) — port 8080
```bash
cd backend
# with MySQL (user root / password root by default — change in application.yml or env vars)
mvn spring-boot:run
# …or without MySQL (file-based H2 database):
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```
The database tables are created automatically and the **raw data from the Figma screens is seeded on first start**
(120 outlets, 60 vehicles, 2 depots, 120 daily orders, trips, deferrals, alerts…).
To reset the demo data: `WAYNEXO_RESEED=true mvn spring-boot:run`.

DB environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME` (default `waynexo`), `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`.

### Frontend (React) — port 5173
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173  (API calls are proxied to :8080)
```
Open on other devices in the same Wi-Fi with `http://<your-mac-ip>:5173` (phone = Driver, iPad = Loader, TV = Dispatcher).

### Production build (single server)
```bash
cd frontend && npm run build
cp -r dist/* ../backend/src/main/resources/static/
cd ../backend && mvn package && java -jar target/waynexo-backend-1.0.0.jar
```

VS Code: open the `WAYNEXO` folder → Run & Debug → **"WAYNEXO Backend (H2 – no MySQL needed)"**.

---

## 2. Login — each role gets its own interface

| Role | Device (Figma frame) | Login page | Username | Password |
|---|---|---|---|---|
| Dispatcher | TV 1280×720 | `/#/login/dispatcher` | `harsha.perera@waynexo.lk` (or `harsha`) | `dispatch123` |
| Store Manager | MacBook Air 1280×832 | `/#/login/store` | `nimal.silva@keells.com` | `store123` |
| Driver | iPhone 13 Pro 390×844 | `/#/login/driver` | `WP-9042` | `driver123` |
| Loader | iPad Pro 11" 1194×834 | `/#/login/loader` | `WP-042` (badge scan, no password) | — |

- `/#/login` **auto-detects the device** (phone → Driver, tablet → Loader, 16:9 TV → Dispatcher, laptop → Store).
- Whoever signs in is always sent to **their own role's interface** — the backend issues a JWT with the role,
  and every API is protected with `@RequireRole`, so a driver can never open dispatcher data (HTTP 403).
- Demo credentials are pre-filled (like the Figma). Set `VITE_DEMO=false` to disable that.

## 3. Aspect-ratio optimised UI (Figma is never changed)

Every screen is built at its **exact Figma frame size** and rendered through `components/Stage.jsx`, which scales
the whole frame uniformly to fit any screen (letter-boxed, aspect ratio preserved). So the layout looks exactly like
the Figma on a phone, iPad, MacBook or a 4K TV — nothing reflows or breaks.
Reference exports of all 24 Figma frames are in `docs/figma-screens/`.

## 4. Suggested demo flow (competition)

1. **Store Manager** → Place Order → adjust cart → *Submit Stock Order* (watch the live 4 PM cutoff timer).
2. **Dispatcher (TV)** → Orders → filter, *Bulk Confirm* → Planning → **drag** an order onto a vehicle
   (try a chilled order on a dry-box truck → *CONSTRAINT ERROR*: reefer, van-only access, weight, volume, fuel quota, 2 trips/day).
3. **Loader (iPad)** → open WP-RE-04 → reverse-order manifest → verify each stop (+/-, GOOD/DAMAGED/SHORT/MISSING),
   *Flag Shortfall* → *Dispatch Vehicle* (seal locked).
4. **Driver (iPhone)** → *Start Trip 1* (only possible after the dock released it) → stop → *Confirm Arrival* →
   Proof of Delivery (draw signature, photo) → *Report* an exception. Turn Wi-Fi off: deliveries are **queued offline**
   and synced automatically when the connection returns (`Offline` tab).
5. **Dispatcher** → Tracking (live route progress + driver feeds) and Dashboard alerts update automatically.
6. **Store Manager** → Receive Shipment → verify items, log damage photo, sign → History shows *Delivered*.
   Deferred order → *View Deferral Alert* → Acknowledge. Dispatcher → Deferrals → *Resolve* / *Edit Notes*.

## 5. Project structure

```
backend/   Spring Boot API
  domain/      JPA entities (Outlet, Vehicle, StockOrder, Trip, TripStop, StopItem, Deferral, OpsEvent…)
  repo/        Spring Data repositories
  service/     Business logic per role (DispatcherService, StoreService, DriverService, LoaderService)
  web/         REST controllers (/api/dispatcher, /api/store, /api/driver, /api/loader, /api/auth)
  security/    JWT (HS256), PBKDF2 password hashing, role interceptor
  resources/seed/*.json   raw data from the Figma + challenge scale
frontend/  React app
  src/screens/{dispatcher,store,driver,loader}   one file per Figma frame
  src/components/Stage.jsx                        aspect-ratio scaler
  src/lib/offline.js                              driver offline cache + outbox sync
tools/     seed/entity generators, Figma exporter plugin
```

## 6. Key API endpoints

| Method | Path | Role |
|---|---|---|
| POST | `/api/auth/login` · GET `/api/auth/me` | all |
| GET | `/api/dispatcher/overview` `/orders` `/planning` `/fleet` `/tracking` `/deferrals` | Dispatcher |
| POST | `/api/dispatcher/orders/confirm` `/planning/assign` `/deferrals/{id}/resolve` | Dispatcher |
| GET/POST | `/api/store/catalog` `/orders` `/schedule` `/receiving` `/deferral` | Store Manager |
| GET/POST | `/api/driver/home` `/trips/{id}/start` `/stops/{id}/pod` `/exceptions` `/sync` | Driver |
| GET/POST | `/api/loader/queue` `/trips/{id}/manifest` `/stops/{id}/verify` `/trips/{id}/dispatch` | Loader |

---
Logo/avatars in `frontend/public/img` were cropped from the Figma exports — for a sharper logo, export
the original logo from Figma as PNG (2×) and replace `frontend/public/img/logo.png`.
