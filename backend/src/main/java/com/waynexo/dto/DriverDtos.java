package com.waynexo.dto;

import java.util.List;

public final class DriverDtos {
    private DriverDtos() {}

    public record VehicleInfo(String plate, String fleetLabel, String depot, String maxPayload) {}
    public record TripCard(Long id, int number, String name, int outlets, String departs, double km, String status, String label) {}
    public record Advisory(String title, String message) {}
    public record Home(String driverName, String initials, VehicleInfo vehicle, String weekday, List<TripCard> trips, Advisory advisory, Long activeTripId) {}

    public record StopRow(Long id, int seq, String outletName, String brand, String window, String eta, String status) {}
    public record TripView(Long id, int number, String name, String status, long completed, int total, List<StopRow> stops) {}

    public record ItemRow(Long id, String name, String temp, int qty, String unit) {}
    public record StopView(Long id, Long tripId, int seq, String outletName, String outletFull, String brandLabel, String address,
                           double distanceKm, String window, String windowEnd, String bay, String note, List<ItemRow> items,
                           String status, boolean arrived) {}

    public record PodItem(Long id, String condition, int damagedQty) {}
    public record PodRequest(List<PodItem> items, String recipientName, String signature, int photoCount, String clientId) {}
    public record PodResult(Long nextStopId, boolean tripCompleted) {}

    public record ExceptionRequest(Long tripId, Long stopId, String type, String details, String severity, String clientId) {}

    public record QueuedPod(Long stopId, PodRequest pod) {}
    public record SyncRequest(List<QueuedPod> pods, List<ExceptionRequest> exceptions) {}
    public record SyncResult(int applied, int skipped) {}
}
