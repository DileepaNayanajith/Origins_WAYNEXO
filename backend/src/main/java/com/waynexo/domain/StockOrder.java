package com.waynexo.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_orders")
public class StockOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    @Enumerated(EnumType.STRING)
    @Column(name = "brand")
    private Brand brand;

    @Column(name = "placed_date")
    private LocalDate placedDate;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "delivery_window")
    private String deliveryWindow;

    @Column(name = "weight_kg")
    private double weightKg;

    @Column(name = "volume_m3")
    private double volumeM3;

    @Enumerated(EnumType.STRING)
    @Column(name = "temp_class")
    private TempClass tempClass;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status;

    @Column(name = "items_summary")
    private String itemsSummary;

    @Column(name = "item_count")
    private int itemCount;

    @Column(name = "source")
    private String source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "receipt_notes", length = 2000)
    private String receiptNotes;

    @Lob
    @Column(name = "receipt_signature")
    private String receiptSignature;

    @Lob
    @Column(name = "damage_photo")
    private String damagePhoto;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "exception_note", length = 1000)
    private String exceptionNote;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Outlet getOutlet() { return outlet; }
    public void setOutlet(Outlet outlet) { this.outlet = outlet; }
    public Brand getBrand() { return brand; }
    public void setBrand(Brand brand) { this.brand = brand; }
    public LocalDate getPlacedDate() { return placedDate; }
    public void setPlacedDate(LocalDate placedDate) { this.placedDate = placedDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getDeliveryWindow() { return deliveryWindow; }
    public void setDeliveryWindow(String deliveryWindow) { this.deliveryWindow = deliveryWindow; }
    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double weightKg) { this.weightKg = weightKg; }
    public double getVolumeM3() { return volumeM3; }
    public void setVolumeM3(double volumeM3) { this.volumeM3 = volumeM3; }
    public TempClass getTempClass() { return tempClass; }
    public void setTempClass(TempClass tempClass) { this.tempClass = tempClass; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public String getItemsSummary() { return itemsSummary; }
    public void setItemsSummary(String itemsSummary) { this.itemsSummary = itemsSummary; }
    public int getItemCount() { return itemCount; }
    public void setItemCount(int itemCount) { this.itemCount = itemCount; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public String getReceiptNotes() { return receiptNotes; }
    public void setReceiptNotes(String receiptNotes) { this.receiptNotes = receiptNotes; }
    public String getReceiptSignature() { return receiptSignature; }
    public void setReceiptSignature(String receiptSignature) { this.receiptSignature = receiptSignature; }
    public String getDamagePhoto() { return damagePhoto; }
    public void setDamagePhoto(String damagePhoto) { this.damagePhoto = damagePhoto; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
    public String getExceptionNote() { return exceptionNote; }
    public void setExceptionNote(String exceptionNote) { this.exceptionNote = exceptionNote; }
}
