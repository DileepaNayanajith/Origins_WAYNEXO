package com.waynexo.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ops_events")
public class OpsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind")
    private EventKind kind;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private Severity severity;

    @Column(name = "title")
    private String title;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "actor")
    private String actor;

    @Column(name = "vehicle_code")
    private String vehicleCode;

    @Column(name = "depot_code")
    private String depotCode;

    @Column(name = "resolved")
    private boolean resolved;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EventKind getKind() { return kind; }
    public void setKind(EventKind kind) { this.kind = kind; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getVehicleCode() { return vehicleCode; }
    public void setVehicleCode(String vehicleCode) { this.vehicleCode = vehicleCode; }
    public String getDepotCode() { return depotCode; }
    public void setDepotCode(String depotCode) { this.depotCode = depotCode; }
    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
