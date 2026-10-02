package com.waynexo.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "outlets")
public class Outlet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "brand")
    private Brand brand;

    @Column(name = "name")
    private String name;

    @Column(name = "area")
    private String area;

    @Column(name = "district")
    private String district;

    @Column(name = "address")
    private String address;

    @Column(name = "van_only_access")
    private boolean vanOnlyAccess;

    @Column(name = "outlet_no")
    private int outletNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depot_id")
    private Depot depot;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Brand getBrand() { return brand; }
    public void setBrand(Brand brand) { this.brand = brand; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public boolean isVanOnlyAccess() { return vanOnlyAccess; }
    public void setVanOnlyAccess(boolean vanOnlyAccess) { this.vanOnlyAccess = vanOnlyAccess; }
    public int getOutletNo() { return outletNo; }
    public void setOutletNo(int outletNo) { this.outletNo = outletNo; }
    public Depot getDepot() { return depot; }
    public void setDepot(Depot depot) { this.depot = depot; }
}
