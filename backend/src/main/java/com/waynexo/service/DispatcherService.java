package com.waynexo.service;

import com.waynexo.config.OpsClock;
import com.waynexo.domain.*;
import com.waynexo.dto.DispatcherDtos.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/** Dispatcher control tower: SEE (overview) -> DECIDE (orders, planning, fleet) -> RECOVER (tracking, deferrals). */
@Service
@Transactional
public class DispatcherService {

    private final StockOrderRepository orders;
    private final VehicleRepository vehicles;
    private final OutletRepository outlets;
    private final DeferralRepository deferrals;
    private final OpsEventRepository events;
    private final PlanningConflictRepository conflicts;
    private final TripRepository trips;
    private final TripStopRepository stops;
    private final OpsClock clock;
    private final ChallengeRules rules;

    public DispatcherService(StockOrderRepository orders, VehicleRepository vehicles, OutletRepository outlets, DeferralRepository deferrals,
                             OpsEventRepository events, PlanningConflictRepository conflicts, TripRepository trips, TripStopRepository stops,
                             OpsClock clock, ChallengeRules rules) {
        this.orders = orders; this.vehicles = vehicles; this.outlets = outlets; this.deferrals = deferrals; this.events = events;
        this.conflicts = conflicts; this.trips = trips; this.stops = stops; this.clock = clock; this.rules = rules;
    }

    // ---------------------------------------------------------------- SEE
    public Counts counts() {
        return new Counts(orders.countByPlacedDate(clock.today()), vehicles.count(), deferrals.countByResolvedFalse());
    }

    public Overview overview() {
        List<BrandCard> brands = List.of(
                new BrandCard("FRESH", "Fresh Orders", outlets.countByBrand(Brand.FRESH), "outlets daily", "100% chilled compliance target", true),
                new BrandCard("STYLE", "Style Orders", outlets.countByBrand(Brand.STYLE), "outlets weekly", "Peak season capacity adjusted", false),
                new BrandCard("TECH", "Tech Orders", outlets.countByBrand(Brand.TECH), "outlets fragile", "Special box trucks pre-allocated", false));

        Map<VehicleState, Long> byState = vehicles.findAll().stream().collect(Collectors.groupingBy(Vehicle::getState, Collectors.counting()));
        long dispatched = byState.getOrDefault(VehicleState.EN_ROUTE, 0L) + byState.getOrDefault(VehicleState.LOADING, 0L);
        long standby = byState.getOrDefault(VehicleState.AVAILABLE, 0L);
        long workshop = byState.getOrDefault(VehicleState.IN_WORKSHOP, 0L);
        long total = Math.max(1, vehicles.count());

        List<VehicleState> busy = List.of(VehicleState.EN_ROUTE, VehicleState.LOADING);
        Capacity cap = new Capacity(
                Labels.pct(vehicles.findAll().stream().filter(v->v.isReefer() && busy.contains(v.getState())).count(), vehicles.findAll().stream().filter(Vehicle::isReefer).count()),
                Labels.pct(vehicles.countByTypeAndStateIn(VehicleType.DRY_BOX, busy), vehicles.countByType(VehicleType.DRY_BOX)));

        List<Event> alerts = events.findTop20ByKindAndResolvedFalseOrderByCreatedAtDesc(EventKind.ALERT).stream().map(this::event).toList();
        return new Overview(clock.today().toString(), counts(), brands, 16, "Stable Peliyagoda uplink active",
                new Dispatch(Labels.pct(dispatched, total), dispatched, standby, workshop), cap, alerts, alerts.size());
    }

    public Event event(OpsEvent e) {
        return new Event(e.getId(), e.getKind().name(), e.getSeverity().name(), e.getTitle(), e.getMessage(), e.getActor(), e.getVehicleCode(), e.getCreatedAt());
    }

    // ---------------------------------------------------------------- DECIDE: orders desk
    @Transactional(readOnly = true)
    public OrdersPage orders(String brand, String district, String status) {
        List<StockOrder> list = orders.findByPlacedDateOrderByIdAsc(clock.today());
        List<String> districts = list.stream().map(o -> o.getOutlet().getDistrict()).distinct().sorted().toList();
        List<OrderRow> rows = list.stream()
                .filter(o -> isAll(brand) || o.getBrand().name().equalsIgnoreCase(brand))
                .filter(o -> isAll(district) || o.getOutlet().getDistrict().equalsIgnoreCase(district))
                .filter(o -> isAll(status) || o.getStatus().name().equalsIgnoreCase(status))
                .map(this::row).toList();
        return new OrdersPage(rows, districts, counts());
    }

    private static boolean isAll(String v) { return v == null || v.isBlank() || "ALL".equalsIgnoreCase(v); }

    private OrderRow row(StockOrder o) {
        return new OrderRow(o.getId(), o.getCode(), Labels.outletName(o.getOutlet()), o.getBrand().name(), o.getVolumeM3(), o.getWeightKg(),
                Labels.temp(o.getTempClass()), o.getDeliveryWindow(), o.getStatus().name(), o.getOutlet().getDistrict());
    }

    public int confirm(List<Long> ids) {
        int n = 0;
        for (StockOrder o : orders.findAllById(ids == null ? List.of() : ids)) {
            if ((o.getStatus() == OrderStatus.PENDING || o.getStatus() == OrderStatus.DEFERRED)) { o.setStatus(OrderStatus.CONFIRMED); n++; }
        }
        return n;
    }

    @Transactional(readOnly = true)
    public String exportCsv(String brand, String district, String status) {
        StringBuilder sb = new StringBuilder("Order ID,Outlet,Brand,District,Volume (m3),Weight (kg),Temp Compliance,Delivery Window,Status\n");
        for (OrderRow r : orders(brand, district, status).orders()) {
            sb.append(String.join(",", r.code(), q(r.outletName()), r.brand(), r.district(), String.valueOf(r.volumeM3()),
                    String.valueOf(r.weightKg()), q(r.temp()), q(r.window()), r.status())).append('\n');
        }
        return sb.toString();
    }

    private static String q(String s) { return "\"" + (s == null ? "" : s.replace("\"", "\"\"")) + "\""; }

    // ---------------------------------------------------------------- DECIDE: planning workspace
    @Transactional(readOnly = true)
    public Planning planning() { return planning(1); }
    public Planning planning(int tripNumber) {
        Map<String, List<PlanOrder>> groups = new TreeMap<>();
        for (StockOrder o : orders.findByStatusOrderByIdAsc(OrderStatus.CONFIRMED)) {
            groups.computeIfAbsent(o.getOutlet().getDistrict(), k -> new ArrayList<>()).add(planOrder(o));
        }
        List<PlanGroup> g = groups.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue().size(), a.getValue().size()))
                .map(e -> new PlanGroup(e.getKey(), e.getValue())).toList();

        List<BuilderVehicle> vs = vehicles.findAllByOrderByIdAsc().stream()
                .filter(v -> v.getState() == VehicleState.AVAILABLE)
                .sorted(Comparator.comparing((Vehicle v) -> v.getType().ordinal()).thenComparing(Vehicle::getCode))
                .map(v -> builder(v, tripNumber)).toList();
        List<Conflict> c = conflicts.findAllByOrderByCreatedAtDesc().stream()
                .map(x -> new Conflict(x.getId(), x.getVehicleLabel(), x.getMessage())).toList();
        return new Planning(g, vs, c, counts());
    }

    private PlanOrder planOrder(StockOrder o) {
        String outlet = o.getOutlet().getName() + (o.getBrand() == Brand.FRESH ? " Outlet" : o.getOutlet().isVanOnlyAccess() ? " Hub" : "");
        return new PlanOrder(o.getId(), o.getCode(), o.getBrand().name(), Labels.brandTitle(o.getBrand()), outlet, o.getWeightKg(),
                o.getVolumeM3(), Labels.needsReefer(o.getTempClass()), o.getOutlet().isVanOnlyAccess());
    }

    private BuilderVehicle builder(Vehicle v) { return builder(v, 1); }
    private BuilderVehicle builder(Vehicle v, int number) {
        List<StockOrder> assigned = orders.findByVehicleAndStatus(v, OrderStatus.ASSIGNED).stream().filter(o -> o.getPlannedTrip()==number).toList();
        double kg = assigned.stream().mapToDouble(StockOrder::getWeightKg).sum();
        double m3 = assigned.stream().mapToDouble(StockOrder::getVolumeM3).sum();
        List<Assigned> a = assigned.stream().map(o -> new Assigned(o.getId(), o.getCode(), o.getOutlet().getName(), o.getBrand().name())).toList();
        return new BuilderVehicle(v.getId(), v.getCode(), Labels.plate(v), Labels.vehicleDescription(v), v.getType().name(), v.getState().name(),
                v.getDepot().getShortName() + " Depot", v.getCapacityKg(), v.getCapacityM3(), kg, m3, v.getFuelUsedL(), v.getFuelQuotaL(),
                v.getTripsToday(), v.getMaxTrips(), a);
    }

    /** Assigns an order to a vehicle after checking every challenge constraint. Violations are logged as conflicts. */
    @Transactional(noRollbackFor = ApiException.class)
    public BuilderVehicle assign(Long orderId, Long vehicleId) { return assign(orderId, vehicleId, 1); }
    @Transactional(noRollbackFor = ApiException.class)
    public BuilderVehicle assign(Long orderId, Long vehicleId, Integer requestedTrip) {
        StockOrder o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        Vehicle v = vehicles.findLockedById(vehicleId).orElseThrow(() -> ApiException.notFound("Vehicle not found"));
        int tripNumber = requestedTrip == null ? 1 : requestedTrip;
        if (tripNumber < 1 || tripNumber > Math.min(2, v.getMaxTrips())) throw ApiException.badRequest("Choose Trip 1 or Trip 2 within this vehicle's limit");
        if (o.getTrip() != null || (o.getStatus() != OrderStatus.CONFIRMED && o.getStatus() != OrderStatus.ASSIGNED)) throw ApiException.conflict("Only confirmed, unreleased orders can be assigned", null);
        String label = v.getCode() + " (" + Labels.vehicleType(v.getType()).replace("Small Delivery ", "") + ")";

        List<StockOrder> current = orders.findByVehicleAndStatus(v, OrderStatus.ASSIGNED).stream()
                .filter(x -> !x.getId().equals(o.getId()) && x.getPlannedTrip() == tripNumber && x.getDeliveryDate().equals(o.getDeliveryDate())).toList();
        double kg = current.stream().mapToDouble(StockOrder::getWeightKg).sum() + o.getWeightKg();
        double m3 = current.stream().mapToDouble(StockOrder::getVolumeM3).sum() + o.getVolumeM3();

        int previousTrip = o.getPlannedTrip();
        o.setPlannedTrip(tripNumber);
        List<StockOrder> candidate = new ArrayList<>(current); candidate.add(o);
        try { rules.validate(v, candidate); } finally { o.setPlannedTrip(previousTrip); }
        String error = null;
        if (!o.getOutlet().getDepot().getId().equals(v.getDepot().getId())) error = "Vehicle " + v.getCode() + " is based at " + v.getDepot().getName() + "; outlet is served from " + o.getOutlet().getDepot().getName() + ".";
        else if (v.getState() == VehicleState.IN_WORKSHOP) error = v.getCode() + " is in the workshop and cannot take loads.";
        else if (Labels.needsReefer(o.getTempClass()) && !v.isReefer())
            error = "Assigned " + o.getCode() + " requires chilled temperature compartment, but " + v.getCode() + " is ambient only.";
        else if (o.getOutlet().isVanOnlyAccess() && v.getType() != VehicleType.VAN)
            error = o.getCode() + " outlet has van-only access, but " + v.getCode() + " is a " + Labels.vehicleType(v.getType()).toLowerCase() + ".";
        else if (kg > v.getCapacityKg())
            error = "Weight limit exceeded: " + Labels.num(kg) + "kg / " + Labels.num(v.getCapacityKg()) + "kg on " + v.getCode() + ".";
        else if (m3 > v.getCapacityM3())
            error = "Volume limit exceeded: " + Labels.num1(m3) + "m³ / " + Labels.num1(v.getCapacityM3()) + "m³ on " + v.getCode() + ".";


        if (error != null) {
            PlanningConflict c = new PlanningConflict();
            c.setVehicleLabel(label); c.setMessage("Error: " + error); c.setCreatedAt(clock.now());
            conflicts.save(c);
            throw ApiException.conflict(error, new Conflict(c.getId(), c.getVehicleLabel(), c.getMessage()));
        }
        o.setPlannedTrip(tripNumber);
        o.setVehicle(v);
        o.setStatus(OrderStatus.ASSIGNED);
        return builder(v);
    }

    public void unassign(Long orderId) {
        StockOrder o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (o.getStatus() == OrderStatus.ASSIGNED) { o.setVehicle(null); o.setStatus(OrderStatus.CONFIRMED); }
    }

    public void dismissConflict(Long id) { conflicts.deleteById(id); }

    // ---------------------------------------------------------------- DECIDE: fleet
    @Transactional(readOnly = true)
    public Fleet fleet(String type, String depot, String state) {
        List<Vehicle> all = vehicles.findAllByOrderByIdAsc();
        List<FleetVehicle> list = all.stream()
                .filter(v -> isAll(type) || ("REEFER".equalsIgnoreCase(type)?v.isReefer():v.getType().name().equalsIgnoreCase(type)))
                .filter(v -> isAll(depot) || v.getDepot().getCode().equalsIgnoreCase(depot))
                .filter(v -> isAll(state) || v.getState().name().equalsIgnoreCase(state))
                .map(v -> new FleetVehicle(v.getId(), v.getCode(), v.getType().name(), Labels.vehicleDescription(v), v.getDepot().getShortName(),
                        v.getState().name(), v.getFuelUsedL(), v.getFuelQuotaL(), v.getDriverName(), v.getTripsToday(), v.getKmPerL()))
                .toList();
        FleetSummary s = new FleetSummary(all.size(), vehicles.countByType(VehicleType.REEFER), vehicles.countByType(VehicleType.DRY_BOX),
                vehicles.countByType(VehicleType.VAN), all.stream().filter(v->v.getType()==VehicleType.VAN && v.isReefer()).count());
        return new Fleet(list, s, counts());
    }

    public void configureFuelEconomy(Long vehicleId, Double kmPerL) {
        if (kmPerL == null || !Double.isFinite(kmPerL) || kmPerL <= 0 || kmPerL > 100)
            throw ApiException.badRequest("Fuel economy must be greater than 0 and at most 100 km/L");
        Vehicle vehicle = vehicles.findLockedById(vehicleId).orElseThrow(() -> ApiException.notFound("Vehicle not found"));
        if (trips.existsByVehicleAndStatusNot(vehicle, TripStatus.COMPLETED))
            throw ApiException.conflict("Complete released trips before changing fuel economy", null);
        vehicle.setKmPerL(kmPerL);
    }

    // ---------------------------------------------------------------- RECOVER: tracking
    @Transactional(readOnly = true)
    public Tracking tracking() {
        List<Route> routes = new ArrayList<>();
        for (Trip t : trips.findByStatusOrderByIdAsc(TripStatus.ACTIVE)) {
            List<TripStop> s = stops.findByTripOrderBySeqAsc(t);
            List<RouteNode> nodes = new ArrayList<>();
            nodes.add(new RouteNode("DEPOT", "COMPLETED"));
            long done = 1;
            TripStop current = null;
            for (TripStop st : s) {
                nodes.add(new RouteNode("STOP " + st.getSeq(), st.getStatus().name()));
                if (st.getStatus() == StopStatus.COMPLETED) done++;
                if (st.getStatus() == StopStatus.CURRENT && current == null) current = st;
            }
            String brand = s.isEmpty() ? "FRESH" : s.get(0).getOutlet().getBrand().name();
            String cur = current == null ? "All stops completed" : "En Route to " + current.getOutlet().getName();
            String eta = current == null || current.getEta() == null ? "" : LocalTime.parse(current.getEta()).format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
            boolean missed = current != null && windowMissed(current);
            routes.add(new Route(t.getId(), t.getRouteLabel(), brand, Labels.pct(done, nodes.size()), nodes, cur, eta, missed));
        }
        List<Event> feeds = events.findTop20ByKindAndResolvedFalseOrderByCreatedAtDesc(EventKind.DRIVER_FEED).stream().map(this::event).toList();
        return new Tracking(routes, feeds, counts());
    }

    /** True when the ETA is after the end of the stop's delivery window (e.g. ETA 07:20 for 07:00 - 07:15). */
    static boolean windowMissed(TripStop st) {
        try {
            String w = st.getWindowText();
            String end = w.substring(w.lastIndexOf(' ') + 1).replace("–", "").trim();
            return LocalTime.parse(st.getEta()).isAfter(LocalTime.parse(end));
        } catch (Exception e) {
            return false;
        }
    }

    // ---------------------------------------------------------------- RECOVER: deferrals
    @Transactional(readOnly = true)
    public Deferrals deferrals() {
        List<DeferralRow> rows = deferrals.findByResolvedFalseOrderByIdAsc().stream()
                .sorted(Comparator.comparing(Deferral::getConsecutiveSkips).reversed().thenComparing(Deferral::getId))
                .map(d -> new DeferralRow(d.getId(), d.getOrder().getCode(), Labels.outletName(d.getOrder().getOutlet()), d.getOrder().getBrand().name(),
                        d.isStoreFacing() ? "Chilled fleet capacity exceeded" : d.getReason(), d.getConsecutiveSkips(), d.getNote(), d.getImpact().name()))
                .toList();
        HighRisk risk = deferrals.findByResolvedFalseOrderByIdAsc().stream()
                .filter(d -> d.getConsecutiveSkips() >= 2)
                .max(Comparator.comparing(Deferral::getConsecutiveSkips))
                .map(d -> new HighRisk("High Risk Alert: " + d.getOrder().getOutlet().getName() + " " + Labels.brandTitle(d.getOrder().getBrand())
                        + " Outlet has been deferred consecutively " + d.getConsecutiveSkips() + " times."
                        + (d.getOrder().getBrand() == Brand.FRESH ? " Daily grocery delivery required before 8 AM." : "")))
                .orElse(null);
        return new Deferrals(risk, rows, counts());
    }

    public void resolve(Long id) {
        Deferral d = deferrals.findById(id).orElseThrow(() -> ApiException.notFound("Deferral not found"));
        d.setResolved(true);
        StockOrder o = d.getOrder();
        if (o.getStatus() == OrderStatus.DEFERRED) o.setStatus(OrderStatus.CONFIRMED);
        OpsEvent e = new OpsEvent();
        e.setKind(EventKind.ACTIVITY); e.setSeverity(Severity.INFO); e.setTitle("Deferral resolved:");
        e.setMessage(o.getCode() + " returned to the planning queue."); e.setCreatedAt(clock.now());
        events.save(e);
    }

    public void note(Long id, String note) {
        Deferral d = deferrals.findById(id).orElseThrow(() -> ApiException.notFound("Deferral not found"));
        d.setNote(note == null ? "" : note.trim());
    }
}
