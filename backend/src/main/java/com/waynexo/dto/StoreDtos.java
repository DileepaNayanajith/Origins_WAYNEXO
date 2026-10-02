package com.waynexo.dto;

import java.util.List;

public final class StoreDtos {
    private StoreDtos() {}

    public record ProductDto(Long id, String sku, String name, String category, String tempClass, double price, String unit, boolean frequent,
                             double unitWeightKg, double unitVolumeM3) {}
    public record DeliveryOption(String date, String label) {}
    public record Catalog(List<ProductDto> products, int cutoffHour, List<DeliveryOption> deliveryOptions, String brand, List<CartItem> suggested) {}

    public record CartItem(Long productId, int qty) {}
    public record PlaceOrder(String deliveryDate, List<CartItem> items) {}
    public record Placed(Long id, String code, String deliveryLabel, double weightKg, double volumeM3, double value) {}

    public record HistoryRow(Long id, String code, String placed, String brand, String itemsSummary, int itemCount, String deliveryLabel,
                             boolean deliveryAlert, String status, String action, Long deferralId) {}

    public record NextDelivery(String eta, long minutes, String vehicleLabel, String driver, double weightKg, double volumeM3,
                               String staffing, String brand) {}
    public record DayCard(String date, String dayLabel, String brand, String windowLabel, boolean hasDelivery, String vehicle,
                          String summary, String staffing) {}
    public record Schedule(NextDelivery next, List<DayCard> days) {}

    public record ReceiveLine(Long id, String name, int expectedQty, String expectedLabel, Integer receivedQty, String condition, boolean verified) {}
    public record Receiving(Long orderId, String code, String deliveryLabel, String vehicle, List<ReceiveLine> lines) {}
    public record ReceiveLineInput(Long id, Integer receivedQty, String condition, boolean verified) {}
    public record ReceiveRequest(List<ReceiveLineInput> lines, String exceptionNote, String notes, String photo, String signature) {}

    public record PastDeferral(String code, String date, String note) {}
    public record DeferralAlert(Long id, String orderCode, String reason, String rescheduledLabel, String rescheduledShort,
                                boolean acknowledged, List<String> alternatives, List<PastDeferral> history, String depot) {}
}
