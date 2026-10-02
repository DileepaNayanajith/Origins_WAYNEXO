package com.waynexo.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deferrals")
public class Deferral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private StockOrder order;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "impact")
    private Impact impact;

    @Column(name = "consecutive_skips")
    private int consecutiveSkips;

    @Column(name = "note", length = 1000)
    private String note;

    @Column(name = "resolved")
    private boolean resolved;

    @Column(name = "acknowledged")
    private boolean acknowledged;

    @Column(name = "store_facing")
    private boolean storeFacing;

    @Column(name = "rescheduled_date")
    private LocalDate rescheduledDate;

    @Column(name = "rescheduled_window")
    private String rescheduledWindow;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StockOrder getOrder() { return order; }
    public void setOrder(StockOrder order) { this.order = order; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Impact getImpact() { return impact; }
    public void setImpact(Impact impact) { this.impact = impact; }
    public int getConsecutiveSkips() { return consecutiveSkips; }
    public void setConsecutiveSkips(int consecutiveSkips) { this.consecutiveSkips = consecutiveSkips; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public boolean isAcknowledged() { return acknowledged; }
    public void setAcknowledged(boolean acknowledged) { this.acknowledged = acknowledged; }
    public boolean isStoreFacing() { return storeFacing; }
    public void setStoreFacing(boolean storeFacing) { this.storeFacing = storeFacing; }
    public LocalDate getRescheduledDate() { return rescheduledDate; }
    public void setRescheduledDate(LocalDate rescheduledDate) { this.rescheduledDate = rescheduledDate; }
    public String getRescheduledWindow() { return rescheduledWindow; }
    public void setRescheduledWindow(String rescheduledWindow) { this.rescheduledWindow = rescheduledWindow; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
