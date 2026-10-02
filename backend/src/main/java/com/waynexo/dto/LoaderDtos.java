package com.waynexo.dto;

import java.util.List;

public final class LoaderDtos {
    private LoaderDtos() {}

    public record QueueRow(Long tripId, String plate, boolean reefer, String model, String driverName, int stops, int packages,
                           int volumePct, int weightPct, String status) {}
    public record DockQueue(String alert, List<QueueRow> rows) {}

    public record ManifestStop(Long id, int seq, String loadLabel, String title, String brand, String cargo, String itemsLabel,
                               String loadMode, boolean verified, boolean last) {}
    public record Manifest(Long tripId, String plate, String tripLabel, double allocatedKg, double capacityKg, double allocatedM3,
                           double capacityM3, boolean precooled, List<ManifestStop> stops, Long nextStopId, boolean allVerified) {}

    public record VerifyItem(Long id, String name, String sku, String temp, String tempClass, int expected, int loaded, String condition) {}
    public record Verification(Long stopId, Long tripId, String title, String plate, List<VerifyItem> items, int loadedTotal,
                               int expectedTotal, int shortfalls, boolean flagged, boolean verified, Long nextStopId) {}
    public record ItemUpdate(Integer loaded, String condition) {}

    public record DispatchView(Long tripId, String plate, int stopsLoaded, int totalStops, boolean allVerified, List<String> shortfalls,
                               String seal, double grossKg, double adjustmentKg, double volumeM3, boolean dispatched, String status) {}
}
