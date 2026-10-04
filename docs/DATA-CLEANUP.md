# Reviewed master import and QA cleanup

Never run destructive reseeding, DROP TABLE, TRUNCATE, or delete all operational rows. Schema, account passwords, IDs, foreign keys and Git history are retained.

Official General Data CSV files were downloaded from the booklet-linked public folder on 2026-10-04. Raw files and derived JSON are in backend/src/main/resources/challenge. Fleet has 60 vehicles, including 12 reefer trucks and four reefer vans. Outlets have 80 Fresh, 25 Style and 15 Tech. Calendar covers 2024-01-01 through 2026-06-28; dates outside that range explicitly use the booklet's Monday–Saturday operating rule.

## Existing production database

1. Take a Railway MySQL volume/database backup before maintenance where available.
2. Temporarily set WAYNEXO_MAINTENANCE_ENABLED=true and deploy. This enables dispatcher-only maintenance endpoints; it is false by default.
3. GET /api/dispatcher/maintenance/preview with the existing dispatcher token. Save the complete returned JSON privately before any mutation. It contains all modified master columns and precisely selected QA rows, their lines and matching QA exception/events. It does not export password hashes.
4. Review the rows: the four report-identified orders are ORD-88600 through ORD-88603. Do not classify other orders as disposable by appearance or age.
5. POST /api/dispatcher/maintenance/apply with {"backupHash":"sha256 from the saved preview","cleanupQa":true}. If any source data changed since backup, any active trip exists, or QA orders have trip links, the operation refuses and requires a fresh review. Updates and cleanup run in one database transaction.
6. Master rows retain IDs. The original legacy seed order maps its 60 vehicles explicitly to VEH001–VEH060. Account vehicle references migrate through the same mapping. Suresh remains attached to the fourth vehicle, VEH004. Existing password hashes are not touched. Every fleet vehicle receives a driver profile; extra profiles have no password and cannot sign in.
7. Cleanup removes only these unlinked QA orders/lines and the exact report test-marker exception/events. Linked exceptions and unrelated records are retained. If dependent records cause a foreign-key failure, the entire transaction rolls back. Users, roles, products, depots and master data remain.
8. Set WAYNEXO_MAINTENANCE_ENABLED=false and redeploy. Preserve the private backup outside the public repository.

## Recovery

The preview's backup object contains original column/value records for vehicles and outlets and the changed user columns, plus deleted QA records. Restore via a reviewed SQL transaction: update existing master rows by their saved id, update saved user email/depot_id/vehicle_code, then reinsert saved stock_orders before order_lines and exception/events. No password reset is needed. Do not run a wholesale old snapshot over newer operational work. Take another backup before restoration.

## Fresh local walkthrough

`docker compose up --build` creates an isolated MySQL volume and application on port 8080. Empty databases import the official master data and an explicit 200-order overcapacity scenario. The demo is never applied to an existing database, and restarting never resets data. Local demo seed credentials are in README. Railway keeps demo/master/reseed flags false. Use a separate local volume for repeatable tests; never reset the production volume.
