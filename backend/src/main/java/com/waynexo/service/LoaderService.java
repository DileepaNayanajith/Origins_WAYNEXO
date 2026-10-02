package com.waynexo.service;

import com.waynexo.config.OpsClock;
import com.waynexo.domain.*;
import com.waynexo.dto.LoaderDtos.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Loader dock terminal: priority queue, reverse-sequence manifest, item verification and vehicle dispatch. */
@Service
@Transactional
public class LoaderService {

    private static final List<TripStatus> AT_DOCK = List.of(TripStatus.LOADING, TripStatus.WAITING, TripStatus.LOADED);
    private static final Pattern FIRST_NUMBER = Pattern.compile("(\\d+)");

    private final TripRepository trips;
    private final TripStopRepository stops;
    private final StopItemRepository items;
    private final OpsEventRepository events;
    private final OpsClock clock;

    public LoaderService(TripRepository trips, TripStopRepository stops, StopItemRepository items, OpsEventRepository events, OpsClock clock) {
        this.trips = trips; this.stops = stops; this.items = items; this.events = events; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public DockQueue queue(AppUser loader) {
        String depot = loader.getDepot() == null ? "PLG" : loader.getDepot().getCode();
        List<QueueRow> rows = trips.findByTripDateOrderByIdAsc(clock.today()).stream()
                .filter(t -> AT_DOCK.contains(t.getStatus()) && t.getVehicle().getDepot().getCode().equals(depot))
                .sorted(Comparator.comparing((Trip t) -> AT_DOCK.indexOf(t.getStatus())).thenComparing(Trip::getId))
                .map(this::row).toList();
        String alert = events.findTop20ByKindAndResolvedFalseOrderByCreatedAtDesc(EventKind.DOCK_ALERT).stream()
                .filter(e -> e.getDepotCode() == null || e.getDepotCode().equals(depot))
                .map(OpsEvent::getMessage).findFirst().orElse(null);
        return new DockQueue(alert, rows);
    }

    private QueueRow row(Trip t) {
        Vehicle v = t.getVehicle();
        List<TripStop> s = stops.findByTripOrderBySeqAsc(t);
        int packages = s.stream().mapToInt(x -> firstNumber(x.getItemsLabel())).sum();
        String status = switch (t.getStatus()) { case LOADING -> "LOADING"; case LOADED -> "COMPLETE"; default -> "WAITING"; };
        String driver = t.getDriver() != null ? t.getDriver().getFullName() : v.getDriverName();
        return new QueueRow(t.getId(), Labels.plate(v), v.getType() == VehicleType.REEFER, v.getModel(), driver, s.size(), packages,
                Labels.pct(t.getAllocatedM3(), v.getCapacityM3()), Labels.pct(t.getAllocatedKg(), v.getCapacityKg()), status);
    }

    private static int firstNumber(String s) {
        if (s == null) return 0;
        Matcher m = FIRST_NUMBER.matcher(s);
        return m.find() ? Integer.parseInt(m.group(1)) : 0;
    }

    private Trip trip(Long id) { return trips.findById(id).orElseThrow(() -> ApiException.notFound("Trip not found")); }

    /** Opening a waiting vehicle starts its loading. */
    public Manifest manifest(Long tripId) {
        Trip t = trip(tripId);
        if (t.getStatus() == TripStatus.WAITING || t.getStatus() == TripStatus.PLANNED) {
            t.setStatus(TripStatus.LOADING);
            t.getVehicle().setState(VehicleState.LOADING);
        }
        List<TripStop> s = new ArrayList<>(stops.findByTripOrderBySeqAsc(t));
        Collections.reverse(s);   // last delivery is loaded first
        List<ManifestStop> list = new ArrayList<>();
        for (int i = 0; i < s.size(); i++) {
            TripStop st = s.get(i);
            boolean last = i == s.size() - 1;
            list.add(new ManifestStop(st.getId(), st.getSeq(), last ? "LOAD LAST" : "LOAD " + ordinal(i + 1),
                    "Stop " + st.getSeq() + ": " + Labels.outletFull(st.getOutlet()), st.getOutlet().getBrand().name(),
                    st.getCargo(), st.getItemsLabel(), st.getLoadMode(), st.isLoadVerified(), last));
        }
        Long next = s.stream().filter(x -> !x.isLoadVerified()).map(TripStop::getId).findFirst().orElse(null);
        String label = "Trip " + t.getNumber() + " (" + (hourOf(t.getDeparts()) < 12 ? "Morning" : "Afternoon") + " Dispatch)";
        Vehicle v = t.getVehicle();
        return new Manifest(t.getId(), Labels.plate(v), label, t.getAllocatedKg(), v.getCapacityKg(), t.getAllocatedM3(), v.getCapacityM3(),
                t.isPrecooled(), list, next, next == null);
    }

    private static int hourOf(String hhmm) {
        try { return Integer.parseInt(hhmm.substring(0, 2)); } catch (Exception e) { return 6; }
    }

    private static String ordinal(int n) {
        return n + switch (n % 10 == 1 && n != 11 ? 1 : n % 10 == 2 && n != 12 ? 2 : n % 10 == 3 && n != 13 ? 3 : 0) {
            case 1 -> "ST"; case 2 -> "ND"; case 3 -> "RD"; default -> "TH";
        };
    }

    public void precool(Long tripId) {
        Trip t = trip(tripId);
        t.setPrecooled(true);
    }

    @Transactional(readOnly = true)
    public Verification verification(Long stopId) {
        TripStop s = stops.findById(stopId).orElseThrow(() -> ApiException.notFound("Stop not found"));
        List<StopItem> list = items.findByStopOrderByIdAsc(s);
        List<VerifyItem> vi = list.stream().map(i -> new VerifyItem(i.getId(), i.getName(), i.getSku(), Labels.temp(i.getTempClass()),
                i.getTempClass().name(), i.getExpectedQty(), i.getLoadedQty(), i.getLoadCondition() == null ? null : i.getLoadCondition().name())).toList();
        int loaded = list.stream().mapToInt(StopItem::getLoadedQty).sum();
        int expected = list.stream().mapToInt(StopItem::getExpectedQty).sum();
        int shortfalls = (int) list.stream().filter(LoaderService::isException).count();
        String title = "Stop " + s.getSeq() + ": " + Labels.outletFull(s.getOutlet()) + " · " + s.getOutlet().getBrand().name();
        return new Verification(s.getId(), s.getTrip().getId(), title, Labels.plate(s.getTrip().getVehicle()), vi, loaded, expected, shortfalls,
                s.isShortfallFlagged(), s.isLoadVerified(), nextToVerify(s.getTrip(), s.getId()));
    }

    private static boolean isException(StopItem i) {
        return i.getLoadedQty() < i.getExpectedQty() || (i.getLoadCondition() != null && i.getLoadCondition() != ItemCondition.GOOD);
    }

    private Long nextToVerify(Trip t, Long exclude) {
        List<TripStop> s = new ArrayList<>(stops.findByTripOrderBySeqAsc(t));
        Collections.reverse(s);
        return s.stream().filter(x -> !x.isLoadVerified() && !x.getId().equals(exclude)).map(TripStop::getId).findFirst().orElse(null);
    }

    public Verification updateItem(Long itemId, ItemUpdate u) {
        StopItem i = items.findById(itemId).orElseThrow(() -> ApiException.notFound("Item not found"));
        if (u.loaded() != null) i.setLoadedQty(Math.max(0, Math.min(u.loaded(), i.getExpectedQty() * 2)));
        if (u.condition() != null) i.setLoadCondition(ItemCondition.valueOf(u.condition()));
        return verification(i.getStop().getId());
    }

    public Verification flagShortfall(AppUser loader, Long stopId) {
        TripStop s = stops.findById(stopId).orElseThrow(() -> ApiException.notFound("Stop not found"));
        List<String> lines = items.findByStopOrderByIdAsc(s).stream().filter(LoaderService::isException).map(this::shortfallText).toList();
        if (lines.isEmpty()) throw ApiException.badRequest("No shortfalls to flag on this stop");
        s.setShortfallFlagged(true);
        OpsEvent e = new OpsEvent();
        e.setKind(EventKind.ALERT); e.setSeverity(Severity.WARNING); e.setTitle("Dock shortfall (" + Labels.plate(s.getTrip().getVehicle()) + "):");
        e.setMessage(String.join(" ", lines) + " Flagged by " + loader.getFullName() + ".");
        e.setVehicleCode(s.getTrip().getVehicle().getCode()); e.setCreatedAt(clock.now());
        events.save(e);
        return verification(stopId);
    }

    private String shortfallText(StopItem i) {
        int diff = i.getExpectedQty() - i.getLoadedQty();
        String what = i.getName().replaceAll("\\s*\\(.*\\)", "");
        String shortName = what.toLowerCase().contains("milk") ? "Milk" : what.split(" ")[what.split(" ").length - 1];
        String unit = i.getName().toLowerCase().contains("bottle") ? "bottle" : i.getUnit() == null ? "unit" : i.getUnit().toLowerCase().replaceAll("s$", "");
        if (diff > 0) return i.getSku() + " (" + shortName + "): " + diff + " " + unit + (diff > 1 ? "s" : "") + " short.";
        return i.getSku() + " (" + shortName + "): " + (i.getLoadCondition() == null ? "check" : i.getLoadCondition().name().toLowerCase()) + ".";
    }

    public Verification verifyStop(Long stopId) {
        TripStop s = stops.findById(stopId).orElseThrow(() -> ApiException.notFound("Stop not found"));
        for (StopItem i : items.findByStopOrderByIdAsc(s)) if (i.getLoadCondition() == null) i.setLoadCondition(ItemCondition.GOOD);
        s.setLoadVerified(true);
        return verification(stopId);
    }

    @Transactional
    public DispatchView dispatchView(Long tripId) {
        Trip t = trip(tripId);
        List<TripStop> s = stops.findByTripOrderBySeqAsc(t);
        List<String> shortfalls = new ArrayList<>();
        double adjKg = 0, adjM3 = 0;
        for (TripStop st : s) {
            for (StopItem i : items.findByStopOrderByIdAsc(st)) {
                if (!isException(i)) continue;
                int diff = Math.max(0, i.getExpectedQty() - i.getLoadedQty());
                adjKg += diff * i.getUnitWeightKg();
                adjM3 += diff * i.getUnitVolumeM3();
                shortfalls.add(shortfallText(i) + (st.isShortfallFlagged() ? " Dispatcher acknowledged. Plan adjusted." : ""));
            }
        }
        if (t.getSealNo() == null) {
            String suffix = clock.today().format(DateTimeFormatter.ofPattern("MMMdd", Locale.ENGLISH)).toUpperCase();
            t.setSealNo("SL-" + (100000 + new Random(t.getId() * 7919L).nextInt(899999)) + "-" + suffix);
        }
        int loaded = (int) s.stream().filter(TripStop::isLoadVerified).count();
        double adjustment = Math.round(adjKg);
        return new DispatchView(t.getId(), Labels.plate(t.getVehicle()), loaded, s.size(), loaded == s.size(), shortfalls, t.getSealNo(),
                Math.round(t.getAllocatedKg() - adjustment), adjustment, Math.round((t.getAllocatedM3() - adjM3) * 10) / 10.0,
                t.getStatus() == TripStatus.LOADED || t.getStatus() == TripStatus.ACTIVE || t.getStatus() == TripStatus.COMPLETED, t.getStatus().name());
    }

    public DispatchView dispatch(AppUser loader, Long tripId) {
        Trip t = trip(tripId);
        DispatchView v = dispatchView(tripId);
        if (!v.allVerified()) throw ApiException.conflict("Verify all " + v.totalStops() + " stops before dispatching " + v.plate() + ".", null);
        if (t.getStatus() == TripStatus.LOADING || t.getStatus() == TripStatus.WAITING) {
            t.setStatus(TripStatus.LOADED);
            t.setDispatchedAt(clock.now());
            OpsEvent e = new OpsEvent();
            e.setKind(EventKind.ACTIVITY); e.setSeverity(Severity.INFO); e.setTitle("Vehicle released from dock:");
            e.setMessage(v.plate() + " sealed (" + t.getSealNo() + ") by " + loader.getFullName() + ". " + Labels.num(v.grossKg()) + " kg loaded.");
            e.setVehicleCode(t.getVehicle().getCode()); e.setCreatedAt(clock.now());
            events.save(e);
        }
        return dispatchView(tripId);
    }
}
