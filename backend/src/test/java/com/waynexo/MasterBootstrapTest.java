package com.waynexo;
import com.waynexo.config.DataSeeder;
import com.waynexo.repo.*;
import com.waynexo.security.PasswordHasher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:master-bootstrap;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.datasource.username=sa","spring.datasource.password=","waynexo.jwt-secret=master-test-only-secret-at-least-32-characters","waynexo.demo-seed=false","waynexo.master-seed=true","waynexo.account-passwords={\"harsha\":\"private-harsha-test\",\"nimal\":\"private-nimal-test\",\"suresh\":\"private-suresh-test\",\"kasun\":\"private-kasun-test\",\"ruwan\":\"private-ruwan-test\"}"})
class MasterBootstrapTest {
 @Autowired DataSeeder seed;
 @Autowired AppUserRepository users;
 @Autowired DepotRepository depots;
 @Autowired VehicleRepository vehicles;
 @Autowired ProductRepository products;
 @Autowired StockOrderRepository orders;
 @Autowired TripRepository trips;
 @Autowired OpsEventRepository events;
 @Autowired PlanningConflictRepository conflicts;
 @Autowired PasswordHasher hasher;
 @Test void bootstrapPreservesMasterAccountsWithoutSampleOperationsAndDoesNotResetPasswords() throws Exception {
  assertEquals(5,users.count()); assertTrue(depots.count()>0); assertTrue(products.count()>0);
  assertEquals(0,orders.count()); assertEquals(0,trips.count()); assertEquals(0,events.count()); assertEquals(0,conflicts.count());
  var loader=users.findByUsernameIgnoreCase("kasun").orElseThrow();
  assertTrue(hasher.matches("private-kasun-test",loader.getPasswordHash()));
  String before=loader.getPasswordHash(); seed.run();
  assertEquals(before,users.findByUsernameIgnoreCase("kasun").orElseThrow().getPasswordHash());
  vehicles.findAll().forEach(v -> { assertEquals(0,v.getTripsToday()); assertEquals(0,v.getFuelUsedL()); });
 }
}
