package com.waynexo.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class DispatcherDtos {
    private DispatcherDtos() {}

    public record Counts(long orders, long vehicles, long deferrals) {}
    public record BrandCard(String brand, String title, long outlets, String cadence, String note, boolean highlight) {}
    public record Dispatch(int percent, long dispatched, long standby, long workshop) {}
    public record Capacity(int reefer, int dryBox) {}
    public record Event(Long id, String kind, String severity, String title, String message, String actor, String vehicleCode, LocalDateTime createdAt) {}
    public record Overview(String today, Counts counts, List<BrandCard> brands, int cutoffHour, String uplink, Dispatch dispatch,
                           Capacity capacity, List<Event> alerts, long criticalCount) {}

    public record OrderRow(Long id, String code, String outletName, String brand, double volumeM3, double weightKg, String temp,
                           String window, String status, String district) {}
    public record OrdersPage(List<OrderRow> orders, List<String> districts, Counts counts) {}
    public record IdsRequest(List<Long> ids) {}

    public record PlanOrder(Long id, String code, String brand, String brandTitle, String outlet, double weightKg, double volumeM3,
                            boolean requiresReefer, boolean vanOnly) {}
    public record PlanGroup(String district, List<PlanOrder> orders) {}
    public record Assigned(Long orderId, String code, String outletShort, String brand) {}
    public record BuilderVehicle(Long id, String code, String plate, String typeLabel, String type, String state, String depot,
                                 double capacityKg, double capacityM3, double loadKg, double loadM3, double fuelUsed, double fuelQuota,
                                 int tripsToday, int maxTrips, List<Assigned> assigned) {}
    public record Conflict(Long id, String vehicleLabel, String message) {}
    public record Planning(List<PlanGroup> groups, List<BuilderVehicle> vehicles, List<Conflict> conflicts, Counts counts) {}
    public record AssignRequest(Long orderId, Long vehicleId) {}

    public record FleetVehicle(Long id, String code, String type, String typeLabel, String depot, String state, double fuelUsed,
                               double fuelQuota, String driverName, int tripsToday) {}
    public record FleetSummary(long total, long reefers, long dryBox, long vans) {}
    public record Fleet(List<FleetVehicle> vehicles, FleetSummary summary, Counts counts) {}

    public record RouteNode(String label, String status) {}
    public record Route(Long id, String label, String brand, int percent, List<RouteNode> nodes, String current, String eta, boolean windowMissed) {}
    public record Tracking(List<Route> routes, List<Event> feeds, Counts counts) {}

    public record DeferralRow(Long id, String orderCode, String outletName, String brand, String reason, int skips, String note, String impact) {}
    public record HighRisk(String text) {}
    public record Deferrals(HighRisk highRisk, List<DeferralRow> deferrals, Counts counts) {}
    public record NoteRequest(String note) {}
}
