package com.waynexo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waynexo.domain.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import java.time.*;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
public class ChallengeRules {
  private final Map<String, Map<String, String>> outlets = new HashMap<>(),
      travel = new HashMap<>();
  private final Map<String, Integer> service = new HashMap<>();
  private final Map<LocalDate, Boolean> calendar = new HashMap<>();
  private final StockOrderRepository orders;
  private final TripRepository trips;

  public ChallengeRules(StockOrderRepository orders, TripRepository trips) throws Exception {
    this.orders = orders;
    this.trips = trips;
    for (var r : load("outlets")) outlets.put(r.get("outlet_id"), r);
    for (var r : load("district_travel")) travel.put(r.get("district"), r);
    for (var r : load("service_allowance"))
      service.put(
          r.get("brand").toUpperCase() + ":" + r.get("dock_type"),
          Integer.parseInt(r.get("service_allowance_min")));
    for (var r : load("calendar"))
      calendar.put(LocalDate.parse(r.get("date")), "1".equals(r.get("is_operating")));
  }

  private List<Map<String, String>> load(String name) throws Exception {
    try (var in = new ClassPathResource("challenge/" + name + ".json").getInputStream()) {
      return new ObjectMapper().readValue(in, new TypeReference<List<Map<String, String>>>() {});
    }
  }

  public String deliveryWindow(Outlet outlet) {
    var row = outlets.get(outlet.getCode());
    return row == null
        ? (outlet.getBrand() == Brand.FRESH ? "03:30 - 08:00" : "08:00 - 16:00")
        : row.get("window_open_time") + " - " + row.get("window_close_time");
  }

  public boolean operating(LocalDate date) {
    return calendar.getOrDefault(date, date.getDayOfWeek() != DayOfWeek.SUNDAY);
  }

  public LocalDate nextOperating(LocalDate date) {
    do {
      date = date.plusDays(1);
    } while (!operating(date));
    return date;
  }

  public record RoutePlan(
      List<StockOrder> orders,
      List<String> etas,
      int minutes,
      double km,
      double fuel,
      String departure) {}

  public RoutePlan plan(Vehicle v, List<StockOrder> load) {
    if (load.isEmpty()) throw ApiException.badRequest("Trip has no orders");
    StockOrder first = load.get(0);
    var route = travel.get(first.getOutlet().getDistrict());
    if (route == null) throw ApiException.conflict("District has no official travel data", null);
    List<StockOrder> sorted = new ArrayList<>(load);
    sorted.sort(
        Comparator.comparing(
            o ->
                outlets
                    .getOrDefault(o.getOutlet().getCode(), Map.of())
                    .getOrDefault(
                        "window_close_time", first.getBrand() == Brand.FRESH ? "08:00" : "16:00")));
    List<StockOrder> visits =
        new ArrayList<>(
            sorted.stream()
                .collect(
                    java.util.stream.Collectors.toMap(
                        o -> o.getOutlet().getId(), o -> o, (a, b) -> a, LinkedHashMap::new))
                .values());
    int outbound = Integer.parseInt(route.get("depot_to_district_freeflow_min")),
        between = Integer.parseInt(route.get("inter_stop_freeflow_min"));
    int total = outbound;
    for (var o : visits)
      total +=
          service.getOrDefault(
              o.getBrand().name()
                  + ":"
                  + outlets
                      .getOrDefault(o.getOutlet().getCode(), Map.of())
                      .getOrDefault("dock_type", "street"),
              o.getBrand() == Brand.FRESH ? 16 : 55);
    total += between * (visits.size() - 1);
    LocalTime start = first.getBrand() == Brand.FRESH ? LocalTime.of(3, 30) : LocalTime.of(8, 0);
    // A second trip starts after the earlier run in this brand's daily window.
    int earlier = 0;
    for (var t : trips.findByTripDateAndVehicleOrderByNumberAsc(first.getDeliveryDate(), v))
      if (t.getNumber() < first.getPlannedTrip()
          && t.getDeparts() != null
          && LocalTime.parse(t.getDeparts()).isBefore(LocalTime.of(8, 0))
              == (first.getBrand() == Brand.FRESH)) earlier += t.getPlannedMinutes();
    for (int n = 1; n < first.getPlannedTrip(); n++) {
      final int number = n;
      var preceding =
          orders.findByVehicleAndStatus(v, OrderStatus.ASSIGNED).stream()
              .filter(
                  o ->
                      o.getDeliveryDate().equals(first.getDeliveryDate())
                          && o.getPlannedTrip() == number
                          && (o.getBrand() == Brand.FRESH) == (first.getBrand() == Brand.FRESH))
              .toList();
      if (!preceding.isEmpty()) earlier += plan(v, preceding).minutes();
    }
    start = start.plusMinutes(earlier);
    LocalTime at = start.plusMinutes(outbound);
    List<String> etas = new ArrayList<>();
    for (var o : visits) {
      var r = outlets.getOrDefault(o.getOutlet().getCode(), Map.of());
      LocalTime open =
          LocalTime.parse(
              r.getOrDefault("window_open_time", o.getBrand() == Brand.FRESH ? "03:30" : "08:00"));
      LocalTime close =
          LocalTime.parse(
              r.getOrDefault("window_close_time", o.getBrand() == Brand.FRESH ? "08:00" : "16:00"));
      if (at.isBefore(open)) {
        total += Duration.between(at, open).toMinutes();
        at = open;
      }
      int serve =
          service.getOrDefault(
              o.getBrand().name() + ":" + r.getOrDefault("dock_type", "street"),
              o.getBrand() == Brand.FRESH ? 16 : 55);
      if (at.plusMinutes(serve).isAfter(close))
        throw ApiException.conflict("Delivery window exceeded at " + o.getOutlet().getCode(), null);
      etas.add(at.toString());
      at = at.plusMinutes(serve + between);
    }
    int budget = first.getBrand() == Brand.FRESH ? 270 : 480;
    if (earlier + total > budget)
      throw ApiException.conflict(
          "Daily "
              + first.getBrand()
              + " trip budget exceeded ("
              + (earlier + total)
              + " / "
              + budget
              + " minutes)",
          null);
    double km =
        2 * Double.parseDouble(route.get("depot_to_district_km"))
            + (visits.size() - 1) * Double.parseDouble(route.get("inter_stop_km"));
    if (v.getKmPerL() <= 0)
      throw ApiException.conflict("Vehicle fuel economy must be configured before planning", null);
    return new RoutePlan(sorted, etas, total, km, km / v.getKmPerL(), start.toString());
  }

  private int duration(List<StockOrder> load) {
    var r = travel.get(load.get(0).getOutlet().getDistrict());
    int total =
        Integer.parseInt(r.get("depot_to_district_freeflow_min"))
            + (load.size() - 1) * Integer.parseInt(r.get("inter_stop_freeflow_min"));
    for (var o : load)
      total +=
          service.getOrDefault(
              o.getBrand().name()
                  + ":"
                  + outlets
                      .getOrDefault(o.getOutlet().getCode(), Map.of())
                      .getOrDefault("dock_type", "street"),
              o.getBrand() == Brand.FRESH ? 16 : 55);
    return total;
  }

  public void validate(Vehicle v, List<StockOrder> load) {
    StockOrder first = load.get(0);
    if (!operating(first.getDeliveryDate()))
      throw ApiException.conflict("Delivery date is not an operating day", null);
    for (var o : load) {
      if (o.getBrand() != first.getBrand()
          || !o.getOutlet().getDistrict().equals(first.getOutlet().getDistrict()))
        throw ApiException.conflict("A trip must contain one brand and district", null);
      if (!o.getOutlet().getDepot().getId().equals(v.getDepot().getId()))
        throw ApiException.conflict("Vehicle must use the outlet home depot", null);
      if (Labels.needsReefer(o.getTempClass()) && !v.isReefer())
        throw ApiException.conflict("Chilled orders require a refrigerated vehicle", null);
      if (o.getOutlet().isVanOnlyAccess() && v.getType() != VehicleType.VAN)
        throw ApiException.conflict("Outlet permits vans only", null);
    }
    if (load.stream().mapToDouble(StockOrder::getWeightKg).sum() > v.getCapacityKg()
        || load.stream().mapToDouble(StockOrder::getVolumeM3).sum() > v.getCapacityM3())
      throw ApiException.conflict("Trip exceeds weight or volume capacity", null);
    var plan = plan(v, load);
    LocalDate monday =
        first.getDeliveryDate().minusDays(first.getDeliveryDate().getDayOfWeek().getValue() - 1);
    double used =
        trips.findAll().stream()
            .filter(
                t ->
                    t.getVehicle().getId().equals(v.getId())
                        && !t.getTripDate().isBefore(monday)
                        && t.getTripDate().isBefore(monday.plusWeeks(1)))
            .mapToDouble(Trip::getReservedFuelL)
            .sum();
    Map<String, List<StockOrder>> pending = new HashMap<>();
    for (var o : orders.findByVehicleAndStatus(v, OrderStatus.ASSIGNED))
      if (!o.getDeliveryDate().isBefore(monday)
          && o.getDeliveryDate().isBefore(monday.plusWeeks(1))
          && !(o.getDeliveryDate().equals(first.getDeliveryDate())
              && o.getPlannedTrip() == first.getPlannedTrip()))
        pending
            .computeIfAbsent(o.getDeliveryDate() + ":" + o.getPlannedTrip(), k -> new ArrayList<>())
            .add(o);
    for (var group : pending.values()) used += plan(v, group).fuel();
    if (used + plan.fuel() > v.getFuelQuotaL())
      throw ApiException.conflict("Weekly fuel quota would be exceeded", null);
    if (trips.findByTripDateAndVehicleOrderByNumberAsc(first.getDeliveryDate(), v).stream()
        .anyMatch(t -> t.getNumber() == first.getPlannedTrip()))
      throw ApiException.conflict("Vehicle trip number already released", null);
  }
}
