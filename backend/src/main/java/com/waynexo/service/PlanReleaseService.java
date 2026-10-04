package com.waynexo.service;

import com.waynexo.config.OpsClock;
import com.waynexo.domain.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PlanReleaseService {
  private final StockOrderRepository orders;
  private final VehicleRepository vehicles;
  private final AppUserRepository users;
  private final TripRepository trips;
  private final TripStopRepository stops;
  private final StopItemRepository items;
  private final OrderLineRepository lines;
  private final DeferralRepository deferrals;
  private final DispatcherService dispatcher;
  private final OpsClock clock;
  private final ChallengeRules rules;

  public PlanReleaseService(
      StockOrderRepository orders,
      VehicleRepository vehicles,
      AppUserRepository users,
      TripRepository trips,
      TripStopRepository stops,
      StopItemRepository items,
      OrderLineRepository lines,
      DeferralRepository deferrals,
      DispatcherService dispatcher,
      OpsClock clock,
      ChallengeRules rules) {
    this.orders = orders;
    this.vehicles = vehicles;
    this.users = users;
    this.trips = trips;
    this.stops = stops;
    this.items = items;
    this.lines = lines;
    this.deferrals = deferrals;
    this.dispatcher = dispatcher;
    this.clock = clock;
    this.rules = rules;
  }

  public List<Long> release() {
    return release(null);
  }

  public List<Long> release(Long vehicleId) {
    List<StockOrder> assigned =
        orders.findByStatusOrderByIdAsc(OrderStatus.ASSIGNED).stream()
            .filter(o -> o.getTrip() == null)
            .filter(o -> vehicleId == null || o.getVehicle().getId().equals(vehicleId))
            .toList();
    if (assigned.isEmpty())
      throw ApiException.badRequest(
          "No unreleased assigned orders. Confirm and allocate orders first.");
    Map<String, List<StockOrder>> groups =
        assigned.stream()
            .collect(
                Collectors.groupingBy(
                    o ->
                        o.getVehicle().getId()
                            + ":"
                            + o.getDeliveryDate()
                            + ":"
                            + o.getPlannedTrip(),
                    TreeMap::new,
                    Collectors.toList()));
    List<Long> result = new ArrayList<>();
    for (List<StockOrder> group : groups.values()) {
      StockOrder first = group.get(0);
      Vehicle v = vehicles.findLockedById(first.getVehicle().getId()).orElseThrow();
      List<AppUser> drivers =
          users.findAll().stream()
              .filter(u -> u.getRole() == Role.DRIVER && v.getCode().equals(u.getVehicleCode()))
              .toList();
      if (drivers.size() != 1)
        throw ApiException.conflict(
            "Assign exactly one driver account to " + v.getCode() + " before releasing", null);
      if (!trips.findByTripDateAndVehicleOrderByNumberAsc(first.getDeliveryDate(), v).stream()
          .filter(t -> t.getNumber() == first.getPlannedTrip())
          .toList()
          .isEmpty())
        throw ApiException.conflict(
            "This trip number has already been released for " + v.getCode(), null);
      rules.validate(v, group);
      var route = rules.plan(v, group);
      group = route.orders();
      double kg = group.stream().mapToDouble(StockOrder::getWeightKg).sum(),
          m3 = group.stream().mapToDouble(StockOrder::getVolumeM3).sum();
      if (kg > v.getCapacityKg() || m3 > v.getCapacityM3())
        throw ApiException.conflict("Released load exceeds vehicle capacity", null);
      Trip t = new Trip();
      t.setVehicle(v);
      t.setDriver(drivers.get(0));
      t.setTripDate(first.getDeliveryDate());
      t.setNumber(first.getPlannedTrip());
      t.setName(first.getOutlet().getDistrict() + " delivery run");
      t.setRouteLabel(t.getName());
      t.setDeparts(first.getBrand() == Brand.FRESH ? "03:30" : "08:00");
      t.setDeparts(route.departure());
      t.setDistanceKm(route.km());
      t.setReservedFuelL(route.fuel());
      t.setPlannedMinutes(route.minutes());
      t.setStatus(TripStatus.LOADING);
      t.setAllocatedKg(kg);
      t.setAllocatedM3(m3);
      trips.save(t);
      int seq = 0;
      Map<Long, List<StockOrder>> visits =
          group.stream()
              .collect(
                  Collectors.groupingBy(
                      o -> o.getOutlet().getId(), LinkedHashMap::new, Collectors.toList()));
      for (List<StockOrder> visit : visits.values()) {
        StockOrder o = visit.get(0);
        TripStop st = new TripStop();
        st.setTrip(t);
        st.setOrder(o);
        st.setOutlet(o.getOutlet());
        st.setSeq(++seq);
        st.setEta(route.etas().get(seq - 1));
        st.setWindowText(o.getDeliveryWindow());
        st.setStatus(StopStatus.UPCOMING);
        st.setCargo(
            visit.stream().anyMatch(x -> Labels.needsReefer(x.getTempClass()))
                ? "Chilled + ambient compliance"
                : "Ambient");
        st.setItemsLabel(visit.stream().mapToInt(StockOrder::getItemCount).sum() + " items");
        st.setLoadMode("VERIFY ITEMS");
        st.setBay("Dock");
        stops.save(st);
        for (StockOrder delivered : visit) {
          for (OrderLine l : lines.findByOrderOrderByIdAsc(delivered)) {
            StopItem i = new StopItem();
            i.setStop(st);
            i.setName(l.getName());
            i.setSku(l.getProduct().getSku());
            i.setTempClass(l.getProduct().getTempClass());
            i.setExpectedQty(l.getQty());
            i.setUnit(l.getUnit());
            i.setUnitWeightKg(l.getProduct().getUnitWeightKg());
            i.setUnitVolumeM3(l.getProduct().getUnitVolumeM3());
            items.save(i);
          }
          delivered.setTrip(t);
          delivered.setStatus(OrderStatus.SCHEDULED);
        }
      }
      v.setState(VehicleState.LOADING);
      result.add(t.getId());
    }
    return result;
  }

  public Deferral defer(Long orderId, String reason, String note) {
    if (reason == null
        || !Set.of("capacity", "no reefer", "window", "fuel", "no driver")
            .contains(reason.toLowerCase()))
      throw ApiException.badRequest(
          "Choose a deferral reason: capacity, no reefer, window, fuel or no driver");
    if (note == null || note.isBlank() || note.length() > 1000)
      throw ApiException.badRequest("Add a deferral note (1-1000 characters)");
    StockOrder o =
        orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
    if (o.getTrip() != null
        || !List.of(OrderStatus.CONFIRMED, OrderStatus.ASSIGNED).contains(o.getStatus()))
      throw ApiException.conflict("Only confirmed, unreleased orders can be deferred", null);
    LocalDate next = rules.nextOperating(o.getDeliveryDate());
    LocalDate served =
        orders
            .findByOutletAndStatusOrderByDeliveryDateAsc(o.getOutlet(), OrderStatus.DELIVERED)
            .stream()
            .map(StockOrder::getDeliveryDate)
            .max(LocalDate::compareTo)
            .orElse(LocalDate.MIN);
    List<Deferral> prior =
        deferrals.findAll().stream()
            .filter(
                d ->
                    d.getOrder().getOutlet().getId().equals(o.getOutlet().getId())
                        && !d.isResolved()
                        && d.getRescheduledDate() != null
                        && d.getRescheduledDate().isAfter(served))
            .toList();
    int previous = prior.stream().mapToInt(Deferral::getConsecutiveSkips).max().orElse(0);
    int skips =
        prior.stream().anyMatch(d -> next.equals(d.getRescheduledDate()))
            ? Math.max(1, previous)
            : previous + 1;

    Deferral d = new Deferral();
    d.setOrder(o);
    d.setReason(reason);
    d.setNote(note);
    d.setConsecutiveSkips(skips);
    d.setImpact(skips > 1 ? Impact.HIGH : Impact.MEDIUM);
    d.setStoreFacing(true);
    d.setRescheduledDate(next);
    d.setRescheduledWindow(o.getDeliveryWindow());
    d.setCreatedAt(clock.now());
    deferrals.save(d);
    o.setVehicle(null);
    o.setStatus(OrderStatus.DEFERRED);
    o.setDeliveryDate(next);
    return d;
  }

  public Map<String, Integer> autoAllocate() {
    List<StockOrder> queue =
        new ArrayList<>(orders.findByStatusOrderByIdAsc(OrderStatus.CONFIRMED));
    for (var o : orders.findByStatusOrderByIdAsc(OrderStatus.DEFERRED))
      if (!o.getDeliveryDate().isAfter(clock.today())) {
        o.setStatus(OrderStatus.CONFIRMED);
        queue.add(o);
      }
    queue.sort(
        Comparator.comparing(
                (StockOrder o) ->
                    deferrals.findAll().stream()
                        .noneMatch(d -> d.getOrder().getId().equals(o.getId())))
            .thenComparing(o -> !Labels.needsReefer(o.getTempClass()))
            .thenComparing(o -> o.getBrand() != Brand.FRESH)
            .thenComparing(
                o ->
                    orders
                        .findByOutletAndStatusOrderByDeliveryDateAsc(
                            o.getOutlet(), OrderStatus.DELIVERED)
                        .stream()
                        .map(StockOrder::getDeliveryDate)
                        .max(LocalDate::compareTo)
                        .orElse(LocalDate.MIN))
            .thenComparing(StockOrder::getDeliveryDate)
            .thenComparing(StockOrder::getId));
    Set<String> driverVehicles =
        users.findAll().stream()
            .filter(u -> u.getRole() == Role.DRIVER)
            .map(AppUser::getVehicleCode)
            .collect(Collectors.toSet());
    int allocated = 0, deferred = 0;
    for (StockOrder o : queue) {
      boolean done = false;
      for (Vehicle v : vehicles.findAllByOrderByIdAsc()) {
        if (!driverVehicles.contains(v.getCode()) || v.getState() != VehicleState.AVAILABLE)
          continue;
        for (int n = 1; n <= Math.min(2, v.getMaxTrips()); n++) {
          try {
            dispatcher.assign(o.getId(), v.getId(), n);
            allocated++;
            done = true;
            break;
          } catch (ApiException e) {
            if (e.getStatus().value() != 409) throw e;
          }
        }
        if (done) break;
      }
      if (!done) {
        defer(
            o.getId(),
            "capacity",
            "No eligible staffed vehicle/trip satisfies the allocation constraints.");
        deferred++;
      }
    }
    return Map.of("allocated", allocated, "deferred", deferred);
  }
}
