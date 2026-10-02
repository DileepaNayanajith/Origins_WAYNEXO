package com.waynexo.service;

import com.waynexo.config.OpsClock;
import com.waynexo.domain.*;
import com.waynexo.dto.DriverDtos.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.*;

/** Driver mobile app: today's runs, stop-by-stop delivery, proof of delivery, exceptions, offline sync. */
@Service
@Transactional
public class DriverService {

    private final TripRepository trips;
    private final TripStopRepository stops;
    private final StopItemRepository items;
    private final VehicleRepository vehicles;
    private final StockOrderRepository orders;
    private final OpsEventRepository events;
    private final ExceptionReportRepository exceptions;
    private final OpsClock clock;

    public DriverService(TripRepository trips, TripStopRepository stops, StopItemRepository items, VehicleRepository vehicles,
                         StockOrderRepository orders, OpsEventRepository events, ExceptionReportRepository exceptions, OpsClock clock) {
        this.trips = trips; this.stops = stops; this.items = items; this.vehicles = vehicles; this.orders = orders;
        this.events = events; this.exceptions = exceptions; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Home home(AppUser driver) {
        List<Trip> list = trips.findByTripDateAndDriverOrderByNumberAsc(clock.today(), driver);
        Vehicle v = driver.getVehicleCode() == null ? null : vehicles.findByCode(driver.getVehicleCode()).orElse(null);
        if (v == null && !list.isEmpty()) v = list.get(0).getVehicle();

        Trip focus = list.stream().filter(t -> t.getStatus() != TripStatus.COMPLETED).findFirst().orElse(null);
        VehicleInfo info = null;
        if (v != null) {
            double alloc = focus == null ? 0 : focus.getAllocatedKg();
            info = new VehicleInfo(Labels.plate(v), v.getType() == VehicleType.REEFER ? "CHILLED FLEET" : v.getType() == VehicleType.VAN ? "VAN FLEET" : "DRY FLEET",
                    v.getDepot().getName(), Labels.num1(alloc / 1000.0) + " Tons (" + Labels.pct(alloc, v.getCapacityKg()) + "%)");
        }
        List<TripCard> cards = new ArrayList<>();
        for (Trip t : list) {
            String label = t.getStatus() == TripStatus.COMPLETED ? "DONE" : t == focus ? "ACTIVE" : "PENDING";
            cards.add(new TripCard(t.getId(), t.getNumber(), t.getName(), stops.findByTripOrderBySeqAsc(t).size(), t.getDeparts(),
                    t.getDistanceKm(), t.getStatus().name(), label));
        }
        String region = focus == null ? "Depot" : focus.getName().split(" ")[0];
        Advisory adv = new Advisory("Weather Alert — " + region + " Route.",
                "Maintain careful driving conditions. Temperature logs will continue if connectivity is interrupted.");
        return new Home(driver.getFullName(), Labels.initials(driver.getFullName()), info,
                clock.today().getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH), cards, adv, focus == null ? null : focus.getId());
    }

    private Trip ownTrip(AppUser driver, Long id) {
        Trip t = trips.findById(id).orElseThrow(() -> ApiException.notFound("Trip not found"));
        if (t.getDriver() == null || !t.getDriver().getId().equals(driver.getId())) throw ApiException.forbidden("This trip is assigned to another driver");
        return t;
    }

    private TripStop ownStop(AppUser driver, Long id) {
        TripStop s = stops.findById(id).orElseThrow(() -> ApiException.notFound("Stop not found"));
        ownTrip(driver, s.getTrip().getId());
        return s;
    }

    public TripView startTrip(AppUser driver, Long id) {
        Trip t = ownTrip(driver, id);
        if (t.getStatus() == TripStatus.ACTIVE) return trip(driver, id);
        if (t.getStatus() != TripStatus.LOADED)
            throw ApiException.conflict(Labels.plate(t.getVehicle()) + " has not been released by the dock yet. Ask the loader to verify and dispatch the vehicle.", null);
        t.setStatus(TripStatus.ACTIVE);
        t.setStartedAt(clock.now());
        Vehicle v = t.getVehicle();
        v.setState(VehicleState.EN_ROUTE);
        v.setTripsToday(v.getTripsToday() + 1);
        List<TripStop> list = stops.findByTripOrderBySeqAsc(t);
        list.stream().filter(s -> s.getStatus() == StopStatus.UPCOMING).findFirst().ifPresent(s -> s.setStatus(StopStatus.CURRENT));
        for (TripStop s : list) if (s.getOrder() != null) s.getOrder().setStatus(OrderStatus.IN_TRANSIT);
        feed(driver, v.getCode(), Severity.INFO, "Started " + t.getName() + " (" + list.size() + " stops).");
        return trip(driver, id);
    }

    @Transactional(readOnly = true)
    public TripView trip(AppUser driver, Long id) {
        Trip t = ownTrip(driver, id);
        List<TripStop> list = stops.findByTripOrderBySeqAsc(t);
        List<StopRow> rows = list.stream().map(s -> new StopRow(s.getId(), s.getSeq(), Labels.outletFull(s.getOutlet()).replace(" — ", " - "),
                s.getOutlet().getBrand().name(), s.getWindowText(), s.getEta(), s.getStatus().name())).toList();
        long done = list.stream().filter(s -> s.getStatus() == StopStatus.COMPLETED).count();
        return new TripView(t.getId(), t.getNumber(), t.getName(), t.getStatus().name(), done, list.size(), rows);
    }

    @Transactional(readOnly = true)
    public StopView stop(AppUser driver, Long id) {
        TripStop s = ownStop(driver, id);
        Outlet o = s.getOutlet();
        String brand = Labels.brandTitle(o.getBrand()) + (o.getBrand() == Brand.FRESH ? " / Chilled" : "");
        List<ItemRow> rows = items.findByStopOrderByIdAsc(s).stream()
                .map(i -> new ItemRow(i.getId(), i.getName(), Labels.temp(i.getTempClass()), i.getExpectedQty(), i.getUnit())).toList();
        String end = null;
        try {
            String w = s.getWindowText();
            end = clock.today().atTime(LocalTime.parse(w.substring(w.lastIndexOf(' ') + 1).trim())).toString();
        } catch (Exception ignored) { /* free-text window */ }
        double dist = 1.2 + (s.getSeq() * 0.3);
        return new StopView(s.getId(), s.getTrip().getId(), s.getSeq(), o.getName(), Labels.outletFull(o), brand, o.getAddress(), Math.round(dist * 10) / 10.0,
                s.getWindowText().replace(" - ", " – "), end, s.getBay() == null ? "Main Receiving Bay" : s.getBay(),
                s.getDispatcherNote() == null ? "Call the outlet manager on arrival." : s.getDispatcherNote(), rows, s.getStatus().name(), s.getArrivedAt() != null);
    }

    public StopView arrive(AppUser driver, Long id) {
        TripStop s = ownStop(driver, id);
        if (s.getArrivedAt() == null) s.setArrivedAt(clock.now());
        return stop(driver, id);
    }

    public PodResult pod(AppUser driver, Long id, PodRequest req) {
        TripStop s = ownStop(driver, id);
        Trip t = s.getTrip();
        if (s.getStatus() == StopStatus.COMPLETED) return next(t);   // idempotent (offline re-sync)
        if (req.recipientName() == null || req.recipientName().isBlank()) throw ApiException.badRequest("Enter the recipient's full name");
        if (req.signature() == null || req.signature().isBlank()) throw ApiException.badRequest("Recipient signature is required");

        int damaged = 0;
        Map<Long, StopItem> byId = new HashMap<>();
        items.findByStopOrderByIdAsc(s).forEach(i -> byId.put(i.getId(), i));
        if (req.items() != null) for (PodItem pi : req.items()) {
            StopItem i = byId.get(pi.id());
            if (i == null) continue;
            i.setDeliveredCondition(pi.condition() == null ? ItemCondition.GOOD : ItemCondition.valueOf(pi.condition()));
            i.setDamagedQty(pi.damagedQty());
            damaged += pi.damagedQty();
        }
        s.setStatus(StopStatus.COMPLETED);
        s.setCompletedAt(clock.now());
        if (s.getArrivedAt() == null) s.setArrivedAt(clock.now());
        s.setRecipientName(req.recipientName().trim());
        s.setSignature(req.signature());
        s.setPhotoCount(req.photoCount());
        feed(driver, t.getVehicle().getCode(), damaged > 0 ? Severity.WARNING : Severity.INFO,
                "Delivery confirmed at " + s.getOutlet().getName() + (damaged > 0 ? " with " + damaged + " damaged item(s)." : " with chilled temp compliance."));

        List<TripStop> list = stops.findByTripOrderBySeqAsc(t);
        Optional<TripStop> nxt = list.stream().filter(x -> x.getStatus() == StopStatus.UPCOMING).findFirst();
        if (nxt.isPresent()) {
            nxt.get().setStatus(StopStatus.CURRENT);
        } else if (list.stream().allMatch(x -> x.getStatus() == StopStatus.COMPLETED)) {
            t.setStatus(TripStatus.COMPLETED);
            t.setCompletedAt(clock.now());
            t.getVehicle().setState(VehicleState.AVAILABLE);
        }
        return next(t);
    }

    private PodResult next(Trip t) {
        Long nextId = stops.findByTripOrderBySeqAsc(t).stream().filter(x -> x.getStatus() == StopStatus.CURRENT).map(TripStop::getId).findFirst().orElse(null);
        return new PodResult(nextId, t.getStatus() == TripStatus.COMPLETED);
    }

    public Map<String, Object> reportException(AppUser driver, ExceptionRequest req) {
        if (req.clientId() != null && exceptions.existsByClientId(req.clientId())) return Map.of("ok", true, "duplicate", true);
        if (req.type() == null || req.type().isBlank()) throw ApiException.badRequest("Select an exception type");
        ExceptionReport r = new ExceptionReport();
        Trip t = req.tripId() == null ? null : ownTrip(driver, req.tripId());
        TripStop s = req.stopId() == null ? null : ownStop(driver, req.stopId());
        if (t == null && s != null) t = s.getTrip();
        r.setTrip(t); r.setStop(s); r.setReportedBy(driver); r.setType(req.type()); r.setDetails(req.details());
        r.setSeverity(req.severity() == null ? "Medium" : req.severity()); r.setClientId(req.clientId()); r.setCreatedAt(clock.now());
        exceptions.save(r);

        Severity sev = switch (r.getSeverity().toUpperCase()) { case "CRITICAL" -> Severity.CRITICAL; case "LOW" -> Severity.INFO; default -> Severity.WARNING; };
        String vehicle = t != null ? t.getVehicle().getCode() : driver.getVehicleCode();
        String where = s != null ? " at " + s.getOutlet().getName() : "";
        feed(driver, vehicle, sev, r.getType() + where + ": " + (r.getDetails() == null ? "" : r.getDetails()));
        if (sev == Severity.CRITICAL) {
            OpsEvent a = new OpsEvent();
            a.setKind(EventKind.ALERT); a.setSeverity(Severity.CRITICAL); a.setTitle(r.getType() + " reported:");
            a.setMessage("Driver " + driver.getFullName() + " (" + vehicle + ")" + where + ". " + (r.getDetails() == null ? "" : r.getDetails()));
            a.setVehicleCode(vehicle); a.setCreatedAt(clock.now());
            events.save(a);
        }
        return Map.of("ok", true, "id", r.getId());
    }

    /** Replays deliveries/exceptions captured while the driver was offline. Safe to call repeatedly. */
    public SyncResult sync(AppUser driver, SyncRequest req) {
        int applied = 0, skipped = 0;
        if (req.pods() != null) for (QueuedPod q : req.pods()) {
            try { pod(driver, q.stopId(), q.pod()); applied++; } catch (ApiException e) { skipped++; }
        }
        if (req.exceptions() != null) for (ExceptionRequest e : req.exceptions()) {
            try { reportException(driver, e); applied++; } catch (ApiException ex) { skipped++; }
        }
        return new SyncResult(applied, skipped);
    }

    private void feed(AppUser driver, String vehicle, Severity sev, String message) {
        OpsEvent e = new OpsEvent();
        e.setKind(EventKind.DRIVER_FEED); e.setSeverity(sev); e.setActor(driver.getFullName().split(" ")[0].toUpperCase());
        e.setVehicleCode(vehicle); e.setMessage(message); e.setCreatedAt(clock.now());
        events.save(e);
    }

}
