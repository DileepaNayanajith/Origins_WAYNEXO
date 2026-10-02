package com.waynexo.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "stop_items")
public class StopItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stop_id")
    private TripStop stop;

    @Column(name = "sku")
    private String sku;

    @Column(name = "name")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "temp_class")
    private TempClass tempClass;

    @Column(name = "expected_qty")
    private int expectedQty;

    @Column(name = "unit")
    private String unit;

    @Column(name = "loaded_qty")
    private int loadedQty;

    @Enumerated(EnumType.STRING)
    @Column(name = "load_condition")
    private ItemCondition loadCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivered_condition")
    private ItemCondition deliveredCondition;

    @Column(name = "damaged_qty")
    private int damagedQty;

    @Column(name = "unit_weight_kg")
    private double unitWeightKg;

    @Column(name = "unit_volume_m3")
    private double unitVolumeM3;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TripStop getStop() { return stop; }
    public void setStop(TripStop stop) { this.stop = stop; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public TempClass getTempClass() { return tempClass; }
    public void setTempClass(TempClass tempClass) { this.tempClass = tempClass; }
    public int getExpectedQty() { return expectedQty; }
    public void setExpectedQty(int expectedQty) { this.expectedQty = expectedQty; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public int getLoadedQty() { return loadedQty; }
    public void setLoadedQty(int loadedQty) { this.loadedQty = loadedQty; }
    public ItemCondition getLoadCondition() { return loadCondition; }
    public void setLoadCondition(ItemCondition loadCondition) { this.loadCondition = loadCondition; }
    public ItemCondition getDeliveredCondition() { return deliveredCondition; }
    public void setDeliveredCondition(ItemCondition deliveredCondition) { this.deliveredCondition = deliveredCondition; }
    public int getDamagedQty() { return damagedQty; }
    public void setDamagedQty(int damagedQty) { this.damagedQty = damagedQty; }
    public double getUnitWeightKg() { return unitWeightKg; }
    public void setUnitWeightKg(double unitWeightKg) { this.unitWeightKg = unitWeightKg; }
    public double getUnitVolumeM3() { return unitVolumeM3; }
    public void setUnitVolumeM3(double unitVolumeM3) { this.unitVolumeM3 = unitVolumeM3; }
}
