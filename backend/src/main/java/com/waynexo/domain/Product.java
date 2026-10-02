package com.waynexo.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sku", unique = true)
    private String sku;

    @Column(name = "name")
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private ProductCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "temp_class")
    private TempClass tempClass;

    @Column(name = "price")
    private double price;

    @Column(name = "unit")
    private String unit;

    @Column(name = "frequent")
    private boolean frequent;

    @Column(name = "unit_weight_kg")
    private double unitWeightKg;

    @Column(name = "unit_volume_m3")
    private double unitVolumeM3;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public ProductCategory getCategory() { return category; }
    public void setCategory(ProductCategory category) { this.category = category; }
    public TempClass getTempClass() { return tempClass; }
    public void setTempClass(TempClass tempClass) { this.tempClass = tempClass; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public boolean isFrequent() { return frequent; }
    public void setFrequent(boolean frequent) { this.frequent = frequent; }
    public double getUnitWeightKg() { return unitWeightKg; }
    public void setUnitWeightKg(double unitWeightKg) { this.unitWeightKg = unitWeightKg; }
    public double getUnitVolumeM3() { return unitVolumeM3; }
    public void setUnitVolumeM3(double unitVolumeM3) { this.unitVolumeM3 = unitVolumeM3; }
}
