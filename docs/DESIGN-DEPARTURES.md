# Design continuity, departures and limitations

The team supplied an existing application and Figma-derived screen references. The original submitted Designathon package has not been supplied for this audit, so exact fidelity to that submission must be confirmed by the team. This list describes the implemented changes without claiming that an unseen submission was verified.

| Area | Delivered behavior / change |
|---|---|
| Login | One Username/Password page; account-derived role, no role selector; frontend/backend protection. |
| Role devices | Dispatcher TV, driver phone, loader tablet/phone, store desktop/phone; fixed driver frames replaced with responsive flow. |
| Planning | Validated manual/assisted allocation plus automatic allocation; explicit global or per-vehicle release creates dock manifests. |
| Temperature | Mixed ambient/chilled cart split into whole orders; compatible same-outlet orders can share a delivery stop. |
| Fuel | Verified per-vehicle km/L configuration, planned fuel reservation and weekly quota checks. |
| Handover | Loader quantities/shortfalls/pre-cool, driver POD, independent signed store receipt. |
| Offline | Account-scoped browser cache/outbox; only acknowledged outcomes removed; idempotent POD replay. |
| Display accuracy | Placeholder weather removed; route ETAs use planning data; missing/empty records show recovery states. |
| Signature storage | LONGTEXT for driver/store signatures and store damage image; existing data retained during widening. |

Official organiser CSVs are versioned with checksums and import rules. Fresh Docker databases use their 60 vehicles/120 outlets and explicit synthetic operational orders. Existing Railway data requires the separately reviewed master import; it was not silently replaced. The calendar ends on 2026-06-28; later dates use the documented Monday–Saturday rule from the booklet.

The tracking screen shows recorded trip/stop activity and driver reports; live GPS streaming and predictive traffic are not claimed. Driver photo upload currently transmits the photo count with POD rather than persisting the photo image. The local offline queue therefore must not be described as a production photo archive. Route navigation opens Google Maps. There is no admin dashboard.

User passwords and secrets are private. The team must verify the final submission video, original-design fidelity, production data readiness and judge credential handover.
