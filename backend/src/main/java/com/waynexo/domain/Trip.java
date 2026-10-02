package com.waynexo.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private AppUser driver;

    @Column(name = "trip_date")
    private LocalDate tripDate;

    @Column(name = "number_no")
    private int number;

    @Column(name = "name")
    private String name;

    @Column(name = "departs")
    private String departs;

    @Column(name = "distance_km")
    private double distanceKm;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TripStatus status;

    @Column(name = "allocated_kg")
    private double allocatedKg;

    @Column(name = "allocated_m3")
    private double allocatedM3;

    @Column(name = "route_label")
    private String routeLabel;

    @Column(name = "seal_no")
    private String sealNo;

    @Column(name = "precooled")
    private boolean precooled;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public AppUser getDriver() { return driver; }
    public void setDriver(AppUser driver) { this.driver = driver; }
    public LocalDate getTripDate() { return tripDate; }
    public void setTripDate(LocalDate tripDate) { this.tripDate = tripDate; }
    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDeparts() { return departs; }
    public void setDeparts(String departs) { this.departs = departs; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
    public TripStatus getStatus() { return status; }
    public void setStatus(TripStatus status) { this.status = status; }
    public double getAllocatedKg() { return allocatedKg; }
    public void setAllocatedKg(double allocatedKg) { this.allocatedKg = allocatedKg; }
    public double getAllocatedM3() { return allocatedM3; }
    public void setAllocatedM3(double allocatedM3) { this.allocatedM3 = allocatedM3; }
    public String getRouteLabel() { return routeLabel; }
    public void setRouteLabel(String routeLabel) { this.routeLabel = routeLabel; }
    public String getSealNo() { return sealNo; }
    public void setSealNo(String sealNo) { this.sealNo = sealNo; }
    public boolean isPrecooled() { return precooled; }
    public void setPrecooled(boolean precooled) { this.precooled = precooled; }
    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
