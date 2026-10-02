package com.waynexo.service;

import com.waynexo.config.OpsClock;
import com.waynexo.domain.*;
import com.waynexo.dto.StoreDtos.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Store Manager console: place stock orders, track history/schedule, receive shipments, handle deferrals. */
@Service
@Transactional
public class StoreService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE MMM d", Locale.ENGLISH);
    private static final DateTimeFormatter WEEKDAY = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
    private static final int CUTOFF_HOUR = 16;

    private final ProductRepository products;
    private final StockOrderRepository orders;
    private final OrderLineRepository lines;
    private final TripStopRepository stops;
    private final DeferralRepository deferrals;
    private final OpsEventRepository events;
    private final OpsClock clock;

    public StoreService(ProductRepository products, StockOrderRepository orders, OrderLineRepository lines, TripStopRepository stops,
                        DeferralRepository deferrals, OpsEventRepository events, OpsClock clock) {
        this.products = products; this.orders = orders; this.lines = lines; this.stops = stops; this.deferrals = deferrals;
        this.events = events; this.clock = clock;
    }

    private static Outlet outletOf(AppUser u) {
        if (u.getOutlet() == null) throw ApiException.badRequest("No outlet is linked to this account");
        return u.getOutlet();
    }

    // ---------------------------------------------------------------- catalog & ordering
    @Transactional(readOnly = true)
    public Catalog catalog(AppUser user) {
        List<ProductDto> list = products.findAllByOrderByIdAsc().stream()
                .map(p -> new ProductDto(p.getId(), p.getSku(), p.getName(), p.getCategory().name(), p.getTempClass().name(), p.getPrice(),
                        p.getUnit(), p.isFrequent(), p.getUnitWeightKg(), p.getUnitVolumeM3()))
                .toList();
        // Suggested cart = the outlet's most recent order (quick re-order).
        List<CartItem> suggested = orders.findByOutletOrderByPlacedDateDescIdDesc(outletOf(user)).stream()
                .map(lines::findByOrderOrderByIdAsc).filter(l -> !l.isEmpty()).findFirst().orElse(List.of()).stream()
                .filter(l -> l.getProduct() != null).map(l -> new CartItem(l.getProduct().getId(), l.getQty())).toList();
        return new Catalog(list, CUTOFF_HOUR, deliveryOptions(), outletOf(user).getBrand().name(), suggested);
    }

    /** Orders placed before 4 PM can be delivered tomorrow; after the cutoff the earliest is the day after. */
    private List<DeliveryOption> deliveryOptions() {
        LocalDate first = clock.now().getHour() < CUTOFF_HOUR ? clock.today().plusDays(1) : clock.today().plusDays(2);
        List<DeliveryOption> out = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            LocalDate d = first.plusDays(i);
            String rel = d.equals(clock.today().plusDays(1)) ? "Tomorrow, " : d.format(WEEKDAY) + ", ";
            out.add(new DeliveryOption(d.toString(), rel + Labels.monthDay(d) + " (Before 8 AM)"));
        }
        return out;
    }

    public Placed place(AppUser user, PlaceOrder req) {
        Outlet outlet = outletOf(user);
        if (req.items() == null || req.items().stream().noneMatch(i -> i.qty() > 0)) throw ApiException.badRequest("Your cart is empty");
        LocalDate date = req.deliveryDate() == null ? null : LocalDate.parse(req.deliveryDate());
        if (date == null || deliveryOptions().stream().noneMatch(o -> o.date().equals(req.deliveryDate())))
            throw ApiException.badRequest("Today's 4 PM cutoff has passed for that date. Please pick the next available delivery date.");

        StockOrder o = new StockOrder();
        o.setOutlet(outlet); o.setBrand(outlet.getBrand()); o.setPlacedDate(clock.today()); o.setDeliveryDate(date);
        o.setDeliveryWindow("Before 8 AM"); o.setStatus(OrderStatus.PENDING); o.setSource("STORE");
        o.setCode(nextCode());
        double kg = 0, m3 = 0, value = 0;
        int count = 0;
        boolean cold = false;
        List<String> names = new ArrayList<>();
        List<OrderLine> toSave = new ArrayList<>();
        for (CartItem ci : req.items()) {
            if (ci.qty() <= 0) continue;
            Product p = products.findById(ci.productId()).orElseThrow(() -> ApiException.badRequest("Unknown product " + ci.productId()));
            kg += p.getUnitWeightKg() * ci.qty(); m3 += p.getUnitVolumeM3() * ci.qty(); value += p.getPrice() * ci.qty(); count += ci.qty();
            cold |= Labels.needsReefer(p.getTempClass());
            names.add(p.getName().replaceAll("\\s*\\(.*\\)", ""));
            OrderLine l = new OrderLine();
            l.setOrder(o); l.setProduct(p); l.setName(p.getName()); l.setQty(ci.qty()); l.setUnit(p.getUnit()); l.setUnitPrice(p.getPrice());
            toSave.add(l);
        }
        o.setWeightKg(Math.round(kg * 10) / 10.0); o.setVolumeM3(Math.round(m3 * 100) / 100.0);
        o.setTempClass(cold ? TempClass.CHILLED : TempClass.AMBIENT);
        o.setItemCount(count);
        o.setItemsSummary(String.join(", ", names.subList(0, Math.min(2, names.size()))) + (names.size() > 2 ? "..." : ""));
        orders.save(o);
        lines.saveAll(toSave);

        OpsEvent e = new OpsEvent();
        e.setKind(EventKind.ACTIVITY); e.setSeverity(Severity.INFO); e.setTitle("New stock order:");
        e.setMessage(o.getCode() + " from " + Labels.outletFull(outlet) + " (" + count + " items)."); e.setCreatedAt(clock.now());
        events.save(e);
        return new Placed(o.getId(), o.getCode(), Labels.monthDay(date), o.getWeightKg(), o.getVolumeM3(), value);
    }

    private String nextCode() {
        int n = 88600 + (int) (orders.count() % 1000);
        while (orders.findByCode("ORD-" + n).isPresent()) n++;
        return "ORD-" + n;
    }

    // ---------------------------------------------------------------- history
    @Transactional(readOnly = true)
    public List<HistoryRow> history(AppUser user, String status, String brand) {
        List<HistoryRow> out = new ArrayList<>();
        for (StockOrder o : orders.findByOutletOrderByPlacedDateDescIdDesc(outletOf(user))) {
            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status) && !o.getStatus().name().equalsIgnoreCase(status)) continue;
            if (brand != null && !brand.isBlank() && !"ALL".equalsIgnoreCase(brand) && !o.getBrand().name().equalsIgnoreCase(brand)) continue;
            Deferral d = deferrals.findFirstByOrderAndResolvedFalse(o).orElse(null);
            String label;
            boolean alert = false;
            String action = null;
            switch (o.getStatus()) {
                case DEFERRED -> {
                    LocalDate to = d != null && d.getRescheduledDate() != null ? d.getRescheduledDate() : o.getDeliveryDate();
                    label = "Deferred • " + Labels.monthDay(to); alert = true; action = "DEFERRAL";
                }
                case IN_TRANSIT -> { label = "Today (" + o.getDeliveryWindow() + ")"; action = "TRACK"; }
                case DELIVERED -> { label = Labels.longDate(o.getDeliveryDate()); action = "RECEIPT"; }
                default -> { label = Labels.longDate(o.getDeliveryDate()); action = "STAFF"; }
            }
            out.add(new HistoryRow(o.getId(), "#" + o.getCode(), Labels.longDate(o.getPlacedDate()), o.getBrand().name(), o.getItemsSummary(),
                    o.getItemCount(), label, alert, o.getStatus().name(), action, d == null ? null : d.getId()));
        }
        return out;
    }

    // ---------------------------------------------------------------- delivery schedule
    @Transactional(readOnly = true)
    public Schedule schedule(AppUser user) {
        Outlet outlet = outletOf(user);
        LocalDate today = clock.today();
        List<StockOrder> upcoming = orders.findByOutletAndDeliveryDateBetweenOrderByDeliveryDateAsc(outlet, today, today.plusDays(4)).stream()
                .filter(o -> o.getStatus() != OrderStatus.DELIVERED && o.getStatus() != OrderStatus.DEFERRED).toList();

        NextDelivery next = null;
        for (StockOrder o : upcoming) {
            if (o.getStatus() != OrderStatus.IN_TRANSIT) continue;
            TripStop st = stops.findByOrder(o).stream().findFirst().orElse(null);
            LocalTime eta = st != null && st.getEta() != null ? LocalTime.parse(st.getEta()) : LocalTime.of(7, 30);
            long mins = Math.max(0, Duration.between(clock.now(), today.atTime(eta)).toMinutes());
            Vehicle v = o.getVehicle();
            String vehicle = v == null ? "-" : (v.getType() == VehicleType.REEFER ? "Chilled Box Truck" : Labels.vehicleType(v.getType())) + " (" + Labels.plate(v) + ")";
            String driver = st != null && st.getTrip().getDriver() != null ? st.getTrip().getDriver().getFullName() : (v == null ? "-" : v.getDriverName());
            next = new NextDelivery(eta.format(TIME), mins, vehicle, driver, o.getWeightKg(), o.getVolumeM3(),
                    "Schedule " + loaders(o) + " loaders at " + eta.minusMinutes(20).withMinute(eta.minusMinutes(20).getMinute() < 30 ? 0 : 30).format(TIME).replaceFirst("^0", ""),
                    o.getBrand().name());
            break;
        }

        List<DayCard> days = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            LocalDate d = today.plusDays(i);
            StockOrder o = upcoming.stream().filter(x -> x.getDeliveryDate().equals(d)).findFirst().orElse(null);
            if (o == null) {
                days.add(new DayCard(d.toString(), d.format(DAY), null, "No Deliveries", false, "-",
                        "Order Cutoff closes " + d.minusDays(1).format(WEEKDAY) + " 4 PM", "No staff needed"));
                continue;
            }
            TripStop st = stops.findByOrder(o).stream().findFirst().orElse(null);
            String window = st != null && st.getEta() != null ? LocalTime.parse(st.getEta()).format(TIME) : o.getDeliveryWindow();
            String vehicle = o.getVehicle() == null ? "To be allocated" : Labels.plate(o.getVehicle());
            int n = loaders(o);
            days.add(new DayCard(d.toString(), d.format(DAY), o.getBrand().name(), window, true, vehicle,
                    o.getItemsSummary().replace("...", ""), "Schedule " + n + " loader" + (n > 1 ? "s" : "")));
        }
        return new Schedule(next, days);
    }

    private static int loaders(StockOrder o) { return o.getBrand() == Brand.FRESH || o.getWeightKg() > 500 ? 2 : 1; }

    // ---------------------------------------------------------------- receiving
    @Transactional(readOnly = true)
    public Receiving receiving(AppUser user) {
        StockOrder o = orders.findByOutletAndStatusOrderByDeliveryDateAsc(outletOf(user), OrderStatus.IN_TRANSIT).stream().findFirst().orElse(null);
        if (o == null) return null;
        List<ReceiveLine> ls = lines.findByOrderOrderByIdAsc(o).stream()
                .map(l -> new ReceiveLine(l.getId(), l.getName(), l.getQty(), l.getQty() + " " + plural(l.getUnit(), l.getQty()),
                        l.getReceivedQty() == null ? l.getQty() : l.getReceivedQty(),
                        l.getReceivedCondition() == null ? "GOOD" : l.getReceivedCondition().name(), l.isVerified()))
                .toList();
        return new Receiving(o.getId(), o.getCode(), Labels.monthDay(o.getDeliveryDate()), o.getVehicle() == null ? "-" : Labels.plate(o.getVehicle()), ls);
    }

    static String plural(String unit, int n) {
        if (unit == null) return "";
        if (n == 1) return unit;
        return switch (unit) { case "box" -> "boxes"; case "kg" -> "kg"; default -> unit + "s"; };
    }

    public void receive(AppUser user, Long orderId, ReceiveRequest req) {
        StockOrder o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Delivery not found"));
        if (!o.getOutlet().getId().equals(outletOf(user).getId())) throw ApiException.forbidden("This delivery belongs to another outlet");
        if (req.signature() == null || req.signature().isBlank()) throw ApiException.badRequest("Please sign the delivery receipt");
        boolean exception = false;
        Map<Long, OrderLine> byId = new HashMap<>();
        lines.findByOrderOrderByIdAsc(o).forEach(l -> byId.put(l.getId(), l));
        if (req.lines() != null) for (ReceiveLineInput in : req.lines()) {
            OrderLine l = byId.get(in.id());
            if (l == null) continue;
            l.setReceivedQty(in.receivedQty());
            l.setReceivedCondition(in.condition() == null ? ItemCondition.GOOD : ItemCondition.valueOf(in.condition()));
            l.setVerified(in.verified());
            if (l.getReceivedCondition() != ItemCondition.GOOD || (in.receivedQty() != null && in.receivedQty() < l.getQty())) exception = true;
        }
        o.setStatus(OrderStatus.DELIVERED);
        o.setReceivedAt(clock.now()); o.setReceiptNotes(req.notes()); o.setReceiptSignature(req.signature());
        o.setExceptionNote(req.exceptionNote()); o.setDamagePhoto(req.photo());

        OpsEvent e = new OpsEvent();
        e.setKind(exception ? EventKind.ALERT : EventKind.ACTIVITY);
        e.setSeverity(exception ? Severity.WARNING : Severity.INFO);
        e.setTitle(exception ? "Receipt exception:" : "Delivery received:");
        e.setMessage(o.getCode() + " at " + Labels.outletFull(o.getOutlet()) + (exception ? " — " + Optional.ofNullable(req.exceptionNote()).orElse("items short/damaged") : " signed by " + user.getFullName() + "."));
        e.setCreatedAt(clock.now());
        events.save(e);
    }

    // ---------------------------------------------------------------- deferral alert
    @Transactional(readOnly = true)
    public DeferralAlert activeDeferral(AppUser user, Long id) {
        Outlet outlet = outletOf(user);
        List<Deferral> all = deferrals.findByOrder_OutletOrderByCreatedAtDesc(outlet);
        Deferral d = id != null ? all.stream().filter(x -> x.getId().equals(id)).findFirst().orElse(null)
                : all.stream().filter(x -> !x.isResolved()).findFirst().orElse(null);
        if (d == null) return null;
        LocalDate to = d.getRescheduledDate() != null ? d.getRescheduledDate() : d.getOrder().getDeliveryDate();
        String rel = to.equals(clock.today().plusDays(1)) ? "Tomorrow, " : to.format(WEEKDAY) + ", ";
        String win = d.getRescheduledWindow() == null ? "Before 08:00 AM" : d.getRescheduledWindow();
        List<PastDeferral> history = all.stream().filter(x -> !x.getId().equals(d.getId()) && x.isResolved())
                .map(x -> new PastDeferral("#" + x.getOrder().getCode(), Labels.longDate(x.getOrder().getPlacedDate()), x.getNote()))
                .toList();
        return new DeferralAlert(d.getId(), d.getOrder().getCode(), d.getReason(), rel + Labels.monthDay(to) + " (" + win + ")",
                Labels.monthDay(to) + ", " + win.toLowerCase().replace("am", "AM"), d.isAcknowledged(),
                List.of("Initiate urgent inter-store transfer from Kelaniya Keells #02", "Use external local dispatch van for chilled dairy pick-up"),
                history, outlet.getDepot().getName());
    }

    public void acknowledge(AppUser user, Long id) {
        Deferral d = deferrals.findById(id).orElseThrow(() -> ApiException.notFound("Deferral not found"));
        if (!d.getOrder().getOutlet().getId().equals(outletOf(user).getId())) throw ApiException.forbidden("Not your outlet");
        d.setAcknowledged(true);
        OpsEvent e = new OpsEvent();
        e.setKind(EventKind.ACTIVITY); e.setSeverity(Severity.INFO); e.setTitle("Store acknowledged deferral:");
        e.setMessage(d.getOrder().getCode() + " — receiving staff scheduled by " + user.getFullName() + "."); e.setCreatedAt(LocalDateTime.now(clock.zone()));
        events.save(e);
    }
}
