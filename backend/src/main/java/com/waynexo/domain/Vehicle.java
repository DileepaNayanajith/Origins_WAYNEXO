package com.waynexo.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private VehicleType type;

    @Column(name = "model")
    private String model;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depot_id")
    private Depot depot;

    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private VehicleState state;

    @Column(name = "driver_name")
    private String driverName;

    @Column(name = "capacity_kg")
    private double capacityKg;

    @Column(name = "capacity_m3")
    private double capacityM3;

    @Column(name = "fuel_quota_l")
    private double fuelQuotaL;

    @Column(name = "fuel_used_l")
    private double fuelUsedL;

    @Column(name = "trips_today")
    private int tripsToday;

    @Column(name = "max_trips")
    private int maxTrips;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public VehicleType getType() { return type; }
    public void setType(VehicleType type) { this.type = type; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Depot getDepot() { return depot; }
    public void setDepot(Depot depot) { this.depot = depot; }
    public VehicleState getState() { return state; }
    public void setState(VehicleState state) { this.state = state; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public double getCapacityKg() { return capacityKg; }
    public void setCapacityKg(double capacityKg) { this.capacityKg = capacityKg; }
    public double getCapacityM3() { return capacityM3; }
    public void setCapacityM3(double capacityM3) { this.capacityM3 = capacityM3; }
    public double getFuelQuotaL() { return fuelQuotaL; }
    public void setFuelQuotaL(double fuelQuotaL) { this.fuelQuotaL = fuelQuotaL; }
    public double getFuelUsedL() { return fuelUsedL; }
    public void setFuelUsedL(double fuelUsedL) { this.fuelUsedL = fuelUsedL; }
    public int getTripsToday() { return tripsToday; }
    public void setTripsToday(int tripsToday) { this.tripsToday = tripsToday; }
    public int getMaxTrips() { return maxTrips; }
    public void setMaxTrips(int maxTrips) { this.maxTrips = maxTrips; }
}
