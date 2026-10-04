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
 * Imports official challenge master data only into an empty database.
 * Optional local demo scenario is explicit; destructive reseeding is disabled.
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnExpression("${waynexo.demo-seed:false} || ${waynexo.master-seed:false}")
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
    private final boolean demo;
    private final String accountPasswords;

    public DataSeeder(DepotRepository depots, OutletRepository outlets, AppUserRepository users, VehicleRepository vehicles,
                      ProductRepository products, StockOrderRepository orders, OrderLineRepository lines, TripRepository trips,
                      TripStopRepository stops, StopItemRepository items, DeferralRepository deferrals, OpsEventRepository events,
                      ExceptionReportRepository exceptions, PlanningConflictRepository conflicts, PasswordHasher hasher, OpsClock clock,
                      @Value("${waynexo.reseed:false}") boolean reseed,
                      @Value("${waynexo.demo-seed:false}") boolean demo,
                      @Value("${waynexo.account-passwords:}") String accountPasswords) {
        this.depots = depots; this.outlets = outlets; this.users = users; this.vehicles = vehicles; this.products = products;
        this.orders = orders; this.lines = lines; this.trips = trips; this.stops = stops; this.items = items;
        this.deferrals = deferrals; this.events = events; this.exceptions = exceptions; this.conflicts = conflicts;
        this.hasher = hasher; this.clock = clock; this.reseed = reseed; this.demo = demo; this.accountPasswords = accountPasswords;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (reseed) throw new IllegalStateException("Automatic destructive reseeding is disabled. Use the documented cleanup procedure.");
        if (users.count() > 0) {
            log.info("WAYNEXO data already present ({} users) - skipping seed", users.count());
            return;
        }
        if (depots.count() > 0 || outlets.count() > 0 || vehicles.count() > 0 || products.count() > 0 || orders.count() > 0 || trips.count() > 0)
            throw new IllegalStateException("Bootstrap is allowed only on a completely empty database; existing data requires a reviewed import.");
        seed();
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
        Map<String, String> passwords = new HashMap<>();
        if (!demo) {
            if (accountPasswords.isBlank()) throw new IllegalStateException("Master bootstrap requires WAYNEXO_ACCOUNT_PASSWORDS for all role accounts");
            passwords = json.readValue(accountPasswords, new TypeReference<Map<String, String>>() {});
            Set<String> unique = new HashSet<>();
            for (Map<String, Object> m : load("users")) {
                String pw = passwords.get(s(m, "username"));
                if (pw == null || pw.length() < 12 || !unique.add(pw))
                    throw new IllegalStateException("Each bootstrap account requires a distinct password of at least 12 characters");
            }
        }
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
            v.setReefer(b(m, "reefer")); v.setKmPerL(d(m, "kmPerL"));
            v.setFuelUsedL(d(m, "fuelUsedL")); v.setTripsToday(i(m, "tripsToday")); v.setMaxTrips(2);
            if (!demo) { v.setFuelUsedL(0); v.setTripsToday(0); if (v.getState() != VehicleState.IN_WORKSHOP) v.setState(VehicleState.AVAILABLE); }
            vehicleBy.put(v.getCode(), vehicles.save(v));
        }

        Map<String, AppUser> userBy = new HashMap<>();
        for (Map<String, Object> m : load("users")) {
            AppUser u = new AppUser();
            u.setUsername(s(m, "username")); u.setEmployeeId(s(m, "employeeId")); u.setEmail(s(m, "email"));
            String pw = demo ? s(m, "password") : passwords.get(s(m, "username"));
            u.setPasswordHash(hasher.hash(pw == null ? "demo-loader123" : pw));
            u.setFullName(s(m, "fullName")); u.setRole(Role.valueOf(s(m, "role"))); u.setTitle(s(m, "title")); u.setAvatar(s(m, "avatar"));
            u.setDepot(depotBy.get(s(m, "depot")));
            if (m.get("outlet") != null) u.setOutlet(outletBy.get(s(m, "outlet")));
            u.setVehicleCode(s(m, "vehicle"));
            userBy.put(u.getUsername(), users.save(u));
        }

        for (Vehicle v : vehicleBy.values()) {
            if (users.findAll().stream().anyMatch(u -> v.getCode().equals(u.getVehicleCode()))) continue;
            AppUser driver = new AppUser(); driver.setUsername("driver_" + v.getCode().toLowerCase()); driver.setFullName(v.getDriverName()); driver.setRole(Role.DRIVER); driver.setTitle("Driver"); driver.setDepot(v.getDepot()); driver.setVehicleCode(v.getCode());
            // No password is provisioned: these fleet profiles cannot authenticate.
            users.save(driver);
        }
        Map<String, Product> productBy = new HashMap<>();
        for (Map<String, Object> m : load("products")) {
            Product p = new Product();
            p.setSku(s(m, "sku")); p.setName(s(m, "name")); p.setCategory(ProductCategory.valueOf(s(m, "category")));
            p.setTempClass(TempClass.valueOf(s(m, "tempClass"))); p.setPrice(d(m, "price")); p.setUnit(s(m, "unit"));
            p.setFrequent(b(m, "frequent")); p.setUnitWeightKg(d(m, "unitWeightKg")); p.setUnitVolumeM3(d(m, "unitVolumeM3"));
            productBy.put(p.getSku(), products.save(p));
        }

        if (!demo) {
            log.info("Master bootstrap complete: users/master data only; no sample operational records created");
            return;
        }
        LocalDate delivery=today.plusDays(1); while(delivery.getDayOfWeek()==java.time.DayOfWeek.SUNDAY)delivery=delivery.plusDays(1);
        Product ambient=productBy.values().stream().filter(p->p.getTempClass()==TempClass.AMBIENT).findFirst().orElseThrow();
        Product chilled=productBy.get("SKU-FRESH-301");
        int number=1;
        for(Outlet o:outletBy.values().stream().sorted(Comparator.comparing(Outlet::getCode)).toList()) {
            List<Product> demand=o.getBrand()==Brand.FRESH?List.of(ambient,chilled):List.of(ambient);
            for(Product p:demand) {
                int qty=(int)Math.ceil((o.getBrand()==Brand.FRESH?1200:3000)/p.getUnitWeightKg());
                StockOrder order=new StockOrder();order.setCode("DEMO-"+String.format("%05d",number++));order.setOutlet(o);order.setBrand(o.getBrand());order.setPlacedDate(today);order.setDeliveryDate(delivery);order.setDeliveryWindow(o.getBrand()==Brand.FRESH?"03:30 - 08:00":"08:00 - 16:00");order.setTempClass(p.getTempClass());order.setStatus(OrderStatus.PENDING);order.setWeightKg(qty*p.getUnitWeightKg());order.setVolumeM3(qty*p.getUnitVolumeM3());order.setItemCount(qty);order.setItemsSummary(qty+" "+p.getName());order.setSource("DEMO_SCENARIO");orders.save(order);
                OrderLine line=new OrderLine();line.setOrder(order);line.setProduct(p);line.setName(p.getName());line.setQty(qty);line.setUnit(p.getUnit());line.setUnitPrice(p.getPrice());lines.save(line);
            }
        }
        log.info("Competition scenario seeded: {} orders; all awaiting dispatcher confirmation",orders.count());
    }
}
