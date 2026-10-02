package com.waynexo.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waynexo.domain.*;
import com.waynexo.repo.*;
import com.waynexo.security.PasswordHasher;
import com.waynexo.service.Labels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;

/**
 * Loads the raw WAYNEXO data (from the Figma screens + the challenge scale: 120 outlets,
 * 60 vehicles, 2 depots) into the database on first start. Dates are relative to "today"
 * so the demo always looks current. Set WAYNEXO_RESEED=true to wipe and re-seed.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private final ObjectMapper json = new ObjectMapper();

    private final DepotRepository depots;
    private final OutletRepository outlets;
    private final AppUserRepository users;
    private final VehicleRepository vehicles;
    private final ProductRepository products;
    private final StockOrderRepository orders;
    private final OrderLineRepository lines;
    private final TripRepository trips;
    private final TripStopRepository stops;
    private final StopItemRepository items;
    private final DeferralRepository deferrals;
    private final OpsEventRepository events;
    private final ExceptionReportRepository exceptions;
    private final PlanningConflictRepository conflicts;
    private final PasswordHasher hasher;
    private final OpsClock clock;
    private final boolean reseed;

    public DataSeeder(DepotRepository depots, OutletRepository outlets, AppUserRepository users, VehicleRepository vehicles,
                      ProductRepository products, StockOrderRepository orders, OrderLineRepository lines, TripRepository trips,
                      TripStopRepository stops, StopItemRepository items, DeferralRepository deferrals, OpsEventRepository events,
                      ExceptionReportRepository exceptions, PlanningConflictRepository conflicts, PasswordHasher hasher, OpsClock clock,
                      @Value("${waynexo.reseed:false}") boolean reseed) {
        this.depots = depots; this.outlets = outlets; this.users = users; this.vehicles = vehicles; this.products = products;
        this.orders = orders; this.lines = lines; this.trips = trips; this.stops = stops; this.items = items;
        this.deferrals = deferrals; this.events = events; this.exceptions = exceptions; this.conflicts = conflicts;
        this.hasher = hasher; this.clock = clock; this.reseed = reseed;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (reseed) wipe();
        if (users.count() > 0) {
            log.info("WAYNEXO data already present ({} users) - skipping seed", users.count());
            return;
        }
        seed();
    }

    private void wipe() {
        exceptions.deleteAllInBatch(); items.deleteAllInBatch(); stops.deleteAllInBatch(); deferrals.deleteAllInBatch();
        lines.deleteAllInBatch(); orders.deleteAllInBatch(); trips.deleteAllInBatch(); users.deleteAllInBatch();
        vehicles.deleteAllInBatch(); products.deleteAllInBatch(); outlets.deleteAllInBatch(); depots.deleteAllInBatch();
        events.deleteAllInBatch(); conflicts.deleteAllInBatch();
        log.info("WAYNEXO data wiped for re-seed");
    }

    private List<Map<String, Object>> load(String name) throws Exception {
        try (InputStream in = new ClassPathResource("seed/" + name + ".json").getInputStream()) {
            return json.readValue(in, new TypeReference<List<Map<String, Object>>>() {});
        }
    }

    private static String s(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? null : v.toString(); }
    private static double d(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? 0 : ((Number) v).doubleValue(); }
    private static int i(Map<String, Object> m, String k) { Object v = m.get(k); return v == null ? 0 : ((Number) v).intValue(); }
    private static boolean b(Map<String, Object> m, String k) { return Boolean.TRUE.equals(m.get(k)); }

    @SuppressWarnings("unchecked")
    private void seed() throws Exception {
        LocalDate today = clock.today();
        Map<String, Depot> depotBy = new HashMap<>();
        for (Map<String, Object> m : load("depots")) {
            Depot dp = new Depot();
            dp.setCode(s(m, "code")); dp.setName(s(m, "name")); dp.setShortName(s(m, "shortName"));
            depotBy.put(dp.getCode(), depots.save(dp));
        }

        Map<String, Outlet> outletBy = new HashMap<>();
        for (Map<String, Object> m : load("outlets")) {
            Outlet o = new Outlet();
            o.setCode(s(m, "code")); o.setBrand(Brand.valueOf(s(m, "brand"))); o.setName(s(m, "name")); o.setArea(s(m, "area"));
            o.setDistrict(s(m, "district")); o.setAddress(s(m, "address")); o.setVanOnlyAccess(b(m, "vanOnlyAccess"));
            o.setOutletNo(i(m, "outletNo")); o.setDepot(depotBy.get(s(m, "depot")));
            outletBy.put(o.getCode(), outlets.save(o));
        }

        Map<String, Vehicle> vehicleBy = new HashMap<>();
        for (Map<String, Object> m : load("vehicles")) {
            Vehicle v = new Vehicle();
            v.setCode(s(m, "code")); v.setType(VehicleType.valueOf(s(m, "type"))); v.setModel(s(m, "model"));
            v.setDepot(depotBy.get(s(m, "depot"))); v.setState(VehicleState.valueOf(s(m, "state"))); v.setDriverName(s(m, "driverName"));
            v.setCapacityKg(d(m, "capacityKg")); v.setCapacityM3(d(m, "capacityM3")); v.setFuelQuotaL(d(m, "fuelQuotaL"));
            v.setFuelUsedL(d(m, "fuelUsedL")); v.setTripsToday(i(m, "tripsToday")); v.setMaxTrips(2);
            vehicleBy.put(v.getCode(), vehicles.save(v));
        }

        Map<String, AppUser> userBy = new HashMap<>();
        for (Map<String, Object> m : load("users")) {
            AppUser u = new AppUser();
            u.setUsername(s(m, "username")); u.setEmployeeId(s(m, "employeeId")); u.setEmail(s(m, "email"));
            String pw = s(m, "password");
            u.setPasswordHash(pw == null ? null : hasher.hash(pw));
            u.setFullName(s(m, "fullName")); u.setRole(Role.valueOf(s(m, "role"))); u.setTitle(s(m, "title")); u.setAvatar(s(m, "avatar"));
            u.setDepot(depotBy.get(s(m, "depot")));
            if (m.get("outlet") != null) u.setOutlet(outletBy.get(s(m, "outlet")));
            u.setVehicleCode(s(m, "vehicle"));
            userBy.put(u.getUsername(), users.save(u));
        }

        Map<String, Product> productBy = new HashMap<>();
        for (Map<String, Object> m : load("products")) {
            Product p = new Product();
            p.setSku(s(m, "sku")); p.setName(s(m, "name")); p.setCategory(ProductCategory.valueOf(s(m, "category")));
            p.setTempClass(TempClass.valueOf(s(m, "tempClass"))); p.setPrice(d(m, "price")); p.setUnit(s(m, "unit"));
            p.setFrequent(b(m, "frequent")); p.setUnitWeightKg(d(m, "unitWeightKg")); p.setUnitVolumeM3(d(m, "unitVolumeM3"));
            productBy.put(p.getSku(), products.save(p));
        }

        Map<String, StockOrder> orderBy = new HashMap<>();
        for (Map<String, Object> m : load("orders")) {
            StockOrder o = new StockOrder();
            Outlet outlet = outletBy.get(s(m, "outlet"));
            o.setCode(s(m, "code")); o.setOutlet(outlet);
            o.setBrand(m.get("brand") != null ? Brand.valueOf(s(m, "brand")) : outlet.getBrand());
            o.setPlacedDate(today.plusDays(i(m, "placedOffset"))); o.setDeliveryDate(today.plusDays(i(m, "deliveryOffset")));
            o.setDeliveryWindow(s(m, "window")); o.setWeightKg(d(m, "weightKg")); o.setVolumeM3(d(m, "volumeM3"));
            o.setTempClass(TempClass.valueOf(s(m, "tempClass"))); o.setStatus(OrderStatus.valueOf(s(m, "status")));
            o.setItemsSummary(s(m, "itemsSummary")); o.setItemCount(i(m, "itemCount")); o.setSource(s(m, "source"));
            orders.save(o);
            orderBy.put(o.getCode(), o);
            for (Object lo : (List<Object>) m.get("lines")) {
                List<Object> l = (List<Object>) lo;
                Product p = productBy.get((String) l.get(0));
                OrderLine line = new OrderLine();
                line.setOrder(o); line.setProduct(p); line.setName(p.getName()); line.setQty(((Number) l.get(1)).intValue());
                line.setUnit(p.getUnit()); line.setUnitPrice(p.getPrice());
                lines.save(line);
            }
        }
        // Figma "Planning" state: WP-8820 already allocated to the available reefer RE-01
        StockOrder pre = orderBy.get("WP-8820");
        pre.setVehicle(vehicleBy.get("RE-01"));
        pre.setStatus(OrderStatus.ASSIGNED);

        for (Map<String, Object> m : load("deferrals")) {
            Deferral df = new Deferral();
            df.setOrder(orderBy.get(s(m, "order"))); df.setReason(s(m, "reason")); df.setImpact(Impact.valueOf(s(m, "impact")));
            df.setConsecutiveSkips(i(m, "consecutiveSkips")); df.setNote(s(m, "note")); df.setResolved(b(m, "resolved"));
            df.setStoreFacing(b(m, "storeFacing"));
            if (m.get("rescheduledOffset") != null) df.setRescheduledDate(today.plusDays(i(m, "rescheduledOffset")));
            df.setRescheduledWindow(s(m, "rescheduledWindow"));
            df.setCreatedAt(df.getOrder().getPlacedDate().atTime(16, 30));
            deferrals.save(df);
        }

        for (Map<String, Object> m : load("trips")) {
            Trip t = new Trip();
            Vehicle v = vehicleBy.get(s(m, "vehicle"));
            t.setVehicle(v); t.setTripDate(today); t.setNumber(i(m, "number")); t.setName(s(m, "name")); t.setDeparts(s(m, "departs"));
            t.setDistanceKm(d(m, "distanceKm")); t.setStatus(TripStatus.valueOf(s(m, "status")));
            t.setAllocatedKg(d(m, "allocatedKg")); t.setAllocatedM3(d(m, "allocatedM3"));
            t.setRouteLabel(m.get("routeLabel") != null ? s(m, "routeLabel") : t.getName() + " (" + Labels.plate(v) + ")");
            if (m.get("driver") != null) t.setDriver(userBy.get(s(m, "driver")));
            if (t.getStatus() == TripStatus.LOADED) { t.setSealNo("SL-" + (900000 + v.getId() * 17) + "-AUTO"); t.setDispatchedAt(clock.now().minusMinutes(30)); }
            if (t.getStatus() == TripStatus.ACTIVE) t.setStartedAt(clock.now().minusHours(2));
            trips.save(t);
            for (Object so : (List<Object>) m.get("stops")) {
                Map<String, Object> sm = (Map<String, Object>) so;
                TripStop st = new TripStop();
                st.setTrip(t); st.setSeq(i(sm, "seq")); st.setOutlet(outletBy.get(s(sm, "outlet"))); st.setWindowText(s(sm, "window"));
                st.setEta(s(sm, "eta")); st.setStatus(StopStatus.valueOf(s(sm, "status"))); st.setCargo(s(sm, "cargo"));
                st.setItemsLabel(s(sm, "itemsLabel")); st.setLoadMode(s(sm, "loadMode")); st.setBay(s(sm, "bay")); st.setDispatcherNote(s(sm, "note"));
                if (sm.get("order") != null) {
                    StockOrder so2 = orderBy.get(s(sm, "order"));
                    st.setOrder(so2);
                    so2.setTrip(t); so2.setVehicle(v);
                }
                st.setLoadVerified(t.getStatus() == TripStatus.LOADED || t.getStatus() == TripStatus.ACTIVE);
                stops.save(st);
                for (Object io : (List<Object>) sm.get("items")) {
                    List<Object> it = (List<Object>) io;
                    StopItem si = new StopItem();
                    Product p = productBy.get((String) it.get(0));
                    si.setStop(st); si.setSku((String) it.get(0)); si.setName((String) it.get(1)); si.setTempClass(TempClass.valueOf((String) it.get(2)));
                    si.setExpectedQty(((Number) it.get(3)).intValue()); si.setUnit((String) it.get(4));
                    si.setLoadedQty(it.size() > 5 ? ((Number) it.get(5)).intValue() : si.getExpectedQty());
                    si.setLoadCondition(it.size() > 6 ? ItemCondition.valueOf((String) it.get(6)) : null);
                    si.setUnitWeightKg(p == null ? 2.0 : p.getUnitWeightKg()); si.setUnitVolumeM3(p == null ? 0.02 : p.getUnitVolumeM3());
                    items.save(si);
                }
            }
        }

        for (Map<String, Object> m : load("events")) {
            OpsEvent e = new OpsEvent();
            e.setKind(EventKind.valueOf(s(m, "kind"))); e.setSeverity(Severity.valueOf(s(m, "severity"))); e.setTitle(s(m, "title"));
            e.setMessage(s(m, "message")); e.setActor(s(m, "actor")); e.setVehicleCode(s(m, "vehicle")); e.setDepotCode("PLG");
            e.setCreatedAt(clock.now().minusMinutes(i(m, "minutesAgo")));
            events.save(e);
        }
        for (Map<String, Object> m : load("conflicts")) {
            PlanningConflict c = new PlanningConflict();
            c.setVehicleLabel(s(m, "vehicleLabel")); c.setMessage(s(m, "message")); c.setCreatedAt(clock.now().minusMinutes(8));
            conflicts.save(c);
        }
        log.info("WAYNEXO seed complete: {} outlets, {} vehicles, {} orders, {} users", outlets.count(), vehicles.count(), orders.count(), users.count());
    }

}
