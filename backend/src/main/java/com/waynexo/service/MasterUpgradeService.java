package com.waynexo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.waynexo.domain.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MasterUpgradeService {
  private final JdbcTemplate db;
  private final VehicleRepository vehicles;
  private final OutletRepository outlets;
  private final AppUserRepository users;
  private final DepotRepository depots;
  private final ObjectMapper json = new ObjectMapper();

  public MasterUpgradeService(
      JdbcTemplate db,
      VehicleRepository vehicles,
      OutletRepository outlets,
      AppUserRepository users,
      DepotRepository depots) {
    this.db = db;
    this.vehicles = vehicles;
    this.outlets = outlets;
    this.users = users;
    this.depots = depots;
  }

  public Map<String, Object> preview() throws Exception {
    Map<String, Object> rows = new TreeMap<>();
    rows.put("vehicles", db.queryForList("SELECT * FROM vehicles ORDER BY id"));
    rows.put("outlets", db.queryForList("SELECT * FROM outlets ORDER BY id"));
    rows.put(
        "app_users",
        db.queryForList(
            "SELECT id, username, email, vehicle_code, depot_id FROM app_users ORDER BY id"));
    rows.put(
        "qa_orders",
        db.queryForList(
            "SELECT * FROM stock_orders WHERE code IN"
                + " ('ORD-88600','ORD-88601','ORD-88602','ORD-88603') ORDER BY id"));
    rows.put(
        "qa_order_lines",
        db.queryForList(
            "SELECT * FROM order_lines WHERE order_id IN (SELECT id FROM stock_orders WHERE code IN"
                + " ('ORD-88600','ORD-88601','ORD-88602','ORD-88603')) ORDER BY id"));
    rows.put(
        "qa_exceptions",
        db.queryForList(
            "SELECT * FROM exception_reports WHERE details LIKE '%TEST (QA): offline exception test"
                + " - please ignore%' ORDER BY id"));
    rows.put(
        "qa_events",
        db.queryForList(
            "SELECT * FROM ops_events WHERE message LIKE '%TEST (QA): offline exception test -"
                + " please ignore%' ORDER BY id"));
    String body = json.writeValueAsString(rows);
    String hash =
        HexFormat.of()
            .formatHex(
                MessageDigest.getInstance("SHA-256")
                    .digest(body.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    return Map.of(
        "backup",
        rows,
        "sha256",
        hash,
        "target",
        Map.of("outlets", 120, "vehicles", 60, "chilled", 16));
  }

  private List<Map<String, Object>> seed(String name) throws Exception {
    try (var in = new ClassPathResource("seed/" + name + ".json").getInputStream()) {
      return json.readValue(in, new TypeReference<List<Map<String, Object>>>() {});
    }
  }

  @Transactional
  public Map<String, Object> apply(String expectedHash, boolean cleanupQa) throws Exception {
    var snapshot = preview();
    if (expectedHash == null || !expectedHash.equals(snapshot.get("sha256")))
      throw ApiException.conflict("Database changed; save a fresh backup before applying", null);
    var current = vehicles.findAllByOrderByIdAsc();
    if (current.size() != 60 || outlets.count() != 120)
      throw ApiException.conflict(
          "Expected the existing 60-vehicle/120-outlet master dataset; review manually", null);
    if (db.queryForObject("SELECT COUNT(*) FROM trips WHERE status <> 'COMPLETED'", Long.class) > 0)
      throw ApiException.conflict("Complete or review active trips before master import", null);
    var vehicleSeed = seed("vehicles");
    Map<String, String> mapping = new HashMap<>();
    Map<String, Depot> byDepot = new HashMap<>();
    depots.findAll().forEach(d -> byDepot.put(d.getCode(), d));
    // Preserve every existing row ID and all foreign keys; the legacy seed order is explicitly
    // mapped.
    for (int n = 0; n < 60; n++) {
      var v = current.get(n);
      var r = vehicleSeed.get(n);
      mapping.put(v.getCode(), r.get("code").toString());
    }
    for (int n = 0; n < 60; n++) {
      var v = current.get(n);
      var r = vehicleSeed.get(n);
      v.setCode(r.get("code").toString());
      v.setType(VehicleType.valueOf(r.get("type").toString()));
      v.setReefer((Boolean) r.get("reefer"));
      v.setKmPerL(((Number) r.get("kmPerL")).doubleValue());
      v.setCapacityKg(((Number) r.get("capacityKg")).doubleValue());
      v.setCapacityM3(((Number) r.get("capacityM3")).doubleValue());
      v.setFuelQuotaL(((Number) r.get("fuelQuotaL")).doubleValue());
      v.setModel(r.get("model").toString());
      v.setDriverName(r.get("driverName").toString());
      v.setDepot(byDepot.get(r.get("depot")));
    }
    for (var r : seed("outlets")) {
      var o = outlets.findByCode(r.get("code").toString()).orElseThrow();
      o.setName(r.get("name").toString());
      o.setArea(r.get("area").toString());
      o.setDistrict(r.get("district").toString());
      o.setAddress(r.get("address").toString());
      o.setBrand(Brand.valueOf(r.get("brand").toString()));
      o.setDepot(byDepot.get(r.get("depot")));
      o.setVanOnlyAccess((Boolean) r.get("vanOnlyAccess"));
    }
    for (var u : users.findAll()) {
      if (mapping.containsKey(u.getVehicleCode())) {
        u.setVehicleCode(mapping.get(u.getVehicleCode()));
        var v =
            current.stream()
                .filter(x -> x.getCode().equals(u.getVehicleCode()))
                .findFirst()
                .orElseThrow();
        u.setDepot(v.getDepot());
      }
      if ("nimal".equals(u.getUsername())) u.setEmail("nimal.silva@waynexo.lk");
    }
    for (var v : current)
      if (users.findAll().stream().noneMatch(u -> v.getCode().equals(u.getVehicleCode()))) {
        var u = new AppUser();
        u.setUsername("driver_" + v.getCode().toLowerCase());
        u.setFullName(v.getDriverName());
        u.setRole(Role.DRIVER);
        u.setTitle("Driver");
        u.setDepot(v.getDepot());
        u.setVehicleCode(v.getCode());
        users.save(u);
      }
    int deleted = 0;
    if (cleanupQa) {
      long linked =
          db.queryForObject(
              "SELECT COUNT(*) FROM stock_orders WHERE code IN"
                  + " ('ORD-88600','ORD-88601','ORD-88602','ORD-88603') AND trip_id IS NOT NULL",
              Long.class);
      if (linked > 0)
        throw ApiException.conflict(
            "QA orders have trip history; do not delete automatically", null);
      db.update(
          "DELETE FROM order_lines WHERE order_id IN (SELECT id FROM stock_orders WHERE code IN"
              + " ('ORD-88600','ORD-88601','ORD-88602','ORD-88603'))");
      db.update(
          "DELETE FROM ops_events WHERE message LIKE '%TEST (QA): offline exception test - please"
              + " ignore%'");
      deleted =
          db.update(
              "DELETE FROM stock_orders WHERE code IN"
                  + " ('ORD-88600','ORD-88601','ORD-88602','ORD-88603')");
      db.update(
          "DELETE FROM exception_reports WHERE details LIKE '%TEST (QA): offline exception test -"
              + " please ignore%' AND trip_id IS NULL AND stop_id IS NULL");
    }
    return Map.of(
        "vehicles",
        60,
        "outlets",
        120,
        "chilled",
        16,
        "qaOrdersRemoved",
        deleted,
        "passwordsPreserved",
        true);
  }
}
