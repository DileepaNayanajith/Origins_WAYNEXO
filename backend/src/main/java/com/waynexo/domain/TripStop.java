package com.waynexo.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_stops")
public class TripStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "seq")
    private int seq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private StockOrder order;

    @Column(name = "window_text")
    private String windowText;

    @Column(name = "eta")
    private String eta;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StopStatus status;

    @Column(name = "cargo")
    private String cargo;

    @Column(name = "items_label")
    private String itemsLabel;

    @Column(name = "load_mode")
    private String loadMode;

    @Column(name = "bay")
    private String bay;

    @Column(name = "dispatcher_note", length = 1000)
    private String dispatcherNote;

    @Column(name = "load_verified")
    private boolean loadVerified;

    @Column(name = "shortfall_flagged")
    private boolean shortfallFlagged;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "recipient_name")
    private String recipientName;

    @Lob
    @Column(name = "signature")
    private String signature;

    @Column(name = "photo_count")
    private int photoCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }
    public int getSeq() { return seq; }
    public void setSeq(int seq) { this.seq = seq; }
    public Outlet getOutlet() { return outlet; }
    public void setOutlet(Outlet outlet) { this.outlet = outlet; }
    public StockOrder getOrder() { return order; }
    public void setOrder(StockOrder order) { this.order = order; }
    public String getWindowText() { return windowText; }
    public void setWindowText(String windowText) { this.windowText = windowText; }
    public String getEta() { return eta; }
    public void setEta(String eta) { this.eta = eta; }
    public StopStatus getStatus() { return status; }
    public void setStatus(StopStatus status) { this.status = status; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public String getItemsLabel() { return itemsLabel; }
    public void setItemsLabel(String itemsLabel) { this.itemsLabel = itemsLabel; }
    public String getLoadMode() { return loadMode; }
    public void setLoadMode(String loadMode) { this.loadMode = loadMode; }
    public String getBay() { return bay; }
    public void setBay(String bay) { this.bay = bay; }
    public String getDispatcherNote() { return dispatcherNote; }
    public void setDispatcherNote(String dispatcherNote) { this.dispatcherNote = dispatcherNote; }
    public boolean isLoadVerified() { return loadVerified; }
    public void setLoadVerified(boolean loadVerified) { this.loadVerified = loadVerified; }
    public boolean isShortfallFlagged() { return shortfallFlagged; }
    public void setShortfallFlagged(boolean shortfallFlagged) { this.shortfallFlagged = shortfallFlagged; }
    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public void setArrivedAt(LocalDateTime arrivedAt) { this.arrivedAt = arrivedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
    public int getPhotoCount() { return photoCount; }
    public void setPhotoCount(int photoCount) { this.photoCount = photoCount; }
}
