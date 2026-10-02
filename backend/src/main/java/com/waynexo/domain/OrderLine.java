package com.waynexo.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "order_lines")
public class OrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private StockOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "name")
    private String name;

    @Column(name = "qty")
    private int qty;

    @Column(name = "unit")
    private String unit;

    @Column(name = "unit_price")
    private double unitPrice;

    @Column(name = "received_qty")
    private Integer receivedQty;

    @Enumerated(EnumType.STRING)
    @Column(name = "received_condition")
    private ItemCondition receivedCondition;

    @Column(name = "verified")
    private boolean verified;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StockOrder getOrder() { return order; }
    public void setOrder(StockOrder order) { this.order = order; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }
    public Integer getReceivedQty() { return receivedQty; }
    public void setReceivedQty(Integer receivedQty) { this.receivedQty = receivedQty; }
    public ItemCondition getReceivedCondition() { return receivedCondition; }
    public void setReceivedCondition(ItemCondition receivedCondition) { this.receivedCondition = receivedCondition; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
}
