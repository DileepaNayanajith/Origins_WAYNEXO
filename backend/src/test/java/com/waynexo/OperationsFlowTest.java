package com.waynexo;

import static org.junit.jupiter.api.Assertions.*;

import com.waynexo.config.OpsClock;
import com.waynexo.domain.*;
import com.waynexo.dto.*;
import com.waynexo.repo.*;
import com.waynexo.service.*;
import com.waynexo.web.ApiException;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:ops-flow;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.datasource.username=sa",
      "spring.datasource.password=",
      "waynexo.jwt-secret=ops-test-only-secret-at-least-32-characters",
      "waynexo.demo-seed=false",
      "waynexo.master-seed=false"
    })
@Import(OperationsFlowTest.TimeConfig.class)
@Transactional
class OperationsFlowTest {
  @TestConfiguration
  static class TimeConfig {
    @Bean
    @Primary
    OpsClock testClock() {
      return new OpsClock("Asia/Colombo") {
        @Override
        public LocalDate today() {
          return LocalDate.of(2026, 10, 5);
        }

        @Override
        public LocalDateTime now() {
          return today().atTime(10, 0);
        }
      };
    }
  }

  @Autowired StoreService store;
  @Autowired DispatcherService dispatcher;
  @Autowired PlanReleaseService release;
  @Autowired LoaderService loader;
  @Autowired DriverService driver;
  @Autowired ChallengeRules rules;
  @Autowired DepotRepository depots;
  @Autowired VehicleRepository vehicles;
  @Autowired OutletRepository outlets;
  @Autowired AppUserRepository users;
  @Autowired ProductRepository products;
  @Autowired StockOrderRepository orders;
  @Autowired TripRepository trips;
  @Autowired TripStopRepository stops;
  @Autowired StopItemRepository items;
  Depot depot;
  Vehicle vehicle;
  Outlet outlet;
  AppUser sm, dr, ld;
  Product milk, rice;

  @BeforeEach
  void setup() {
    depot = new Depot();
    depot.setCode("PLG");
    depot.setName("Peliyagoda");
    depot.setShortName("Peliyagoda");
    depots.save(depot);
    outlet = new Outlet();
    outlet.setCode("OUT004");
    outlet.setName("OUT004");
    outlet.setArea("Colombo");
    outlet.setAddress("Colombo");
    outlet.setDistrict("Colombo");
    outlet.setBrand(Brand.FRESH);
    outlet.setDepot(depot);
    outlets.save(outlet);
    vehicle = new Vehicle();
    vehicle.setCode("VEH004");
    vehicle.setType(VehicleType.REEFER);
    vehicle.setReefer(true);
    vehicle.setKmPerL(4.4);
    vehicle.setState(VehicleState.AVAILABLE);
    vehicle.setDepot(depot);
    vehicle.setCapacityKg(6840);
    vehicle.setCapacityM3(33.4);
    vehicle.setFuelQuotaL(430);
    vehicle.setMaxTrips(2);
    vehicles.save(vehicle);
    sm = user("store", Role.STORE_MANAGER);
    sm.setOutlet(outlet);
    dr = user("driver", Role.DRIVER);
    dr.setVehicleCode(vehicle.getCode());
    ld = user("loader", Role.LOADER);
    milk = product("MILK", TempClass.CHILLED);
    rice = product("RICE", TempClass.AMBIENT);
  }

  AppUser user(String name, Role role) {
    var u = new AppUser();
    u.setUsername(name);
    u.setFullName(name);
    u.setRole(role);
    u.setDepot(depot);
    return users.save(u);
  }

  Product product(String sku, TempClass temp) {
    var p = new Product();
    p.setSku(sku);
    p.setName(sku);
    p.setCategory(ProductCategory.DAIRY_EGGS);
    p.setTempClass(temp);
    p.setPrice(100);
    p.setUnit("box");
    p.setUnitWeightKg(5);
    p.setUnitVolumeM3(.02);
    return products.save(p);
  }

  StockOrder place(Product p, int qty) {
    var result =
        store.place(
            sm,
            new StoreDtos.PlaceOrder(
                "2026-10-06", List.of(new StoreDtos.CartItem(p.getId(), qty))));
    return orders.findById(result.id()).orElseThrow();
  }

  @Test
  void completeReleasedTripShortfallPrecoolOfflinePodAndReceipt() {
    var o = place(milk, 10);
    dispatcher.confirm(List.of(o.getId()));
    dispatcher.assign(o.getId(), vehicle.getId(), 1);
    assertFalse(driver.home(dr).vehicle().maxPayload().contains("(0%)"));
    Long id = release.release().get(0);
    var trip = trips.findById(id).orElseThrow();
    assertEquals(TripStatus.LOADING, trip.getStatus());
    assertTrue(trip.getReservedFuelL() > 0);
    assertEquals("05:30", stops.findByTripOrderBySeqAsc(trip).get(0).getEta());
    assertThrows(ApiException.class, release::release);
    var manifest = loader.manifest(id);
    var st = stops.findById(manifest.stops().get(0).id()).orElseThrow();
    var item = items.findByStopOrderByIdAsc(st).get(0);
    loader.updateItem(item.getId(), new LoaderDtos.ItemUpdate(9, "GOOD"));
    assertThrows(ApiException.class, () -> loader.verifyStop(st.getId()));
    loader.flagShortfall(ld, st.getId());
    loader.verifyStop(st.getId());
    assertThrows(ApiException.class, () -> loader.dispatch(ld, id));
    loader.precool(id);
    loader.dispatch(ld, id);
    assertEquals(TripStatus.LOADED, trip.getStatus());
    driver.startTrip(dr, id);
    assertTrue(vehicle.getFuelUsedL() > 0);
    driver.arrive(dr, st.getId());
    var pod =
        new DriverDtos.PodRequest(
            List.of(new DriverDtos.PodItem(item.getId(), "GOOD", 0)),
            "Receiver",
            "signature",
            0,
            "qa-pod-1");
    var sync =
        new DriverDtos.SyncRequest(List.of(new DriverDtos.QueuedPod(st.getId(), pod)), List.of());
    assertEquals(1, driver.sync(dr, sync).applied());
    var completed = trip.getCompletedAt();
    assertEquals(1, driver.sync(dr, sync).applied());
    assertEquals(completed, trip.getCompletedAt());
    assertEquals(TripStatus.COMPLETED, trip.getStatus());
    var receiving = store.receiving(sm);
    assertNotNull(receiving);
    var receiptLines =
        receiving.lines().stream()
            .map(x -> new StoreDtos.ReceiveLineInput(x.id(), 9, "SHORT", true))
            .toList();
    store.receive(
        sm,
        o.getId(),
        new StoreDtos.ReceiveRequest(receiptLines, "One box short", "Checked", null, "signed"));
    assertNull(store.receiving(sm));
    assertThrows(
        ApiException.class,
        () ->
            store.receive(
                sm,
                o.getId(),
                new StoreDtos.ReceiveRequest(receiptLines, null, null, null, "signed")));
  }

  @Test
  void splitOrdersShareOneOutletVisitAndEta() {
    var p =
        store.place(
            sm,
            new StoreDtos.PlaceOrder(
                "2026-10-06",
                List.of(
                    new StoreDtos.CartItem(milk.getId(), 2),
                    new StoreDtos.CartItem(rice.getId(), 3))));
    var list = orders.findAll();
    dispatcher.confirm(list.stream().map(StockOrder::getId).toList());
    for (var o : list) dispatcher.assign(o.getId(), vehicle.getId(), 1);
    var id = release.release().get(0);
    var trip = trips.findById(id).orElseThrow();
    var visits = stops.findByTripOrderBySeqAsc(trip);
    assertEquals(1, visits.size());
    assertEquals(2, items.findByStopOrderByIdAsc(visits.get(0)).size());
    assertEquals(2, orders.findByTrip(trip).size());
    assertEquals(24, trip.getDistanceKm());
  }

  @Test
  void secondTripGetsSequentialWindowAndWeekFuelIsReserved() {
    var first = place(milk, 2);
    var second = place(rice, 2);
    dispatcher.confirm(List.of(first.getId(), second.getId()));
    dispatcher.assign(first.getId(), vehicle.getId(), 1);
    dispatcher.assign(second.getId(), vehicle.getId(), 2);
    var ids = release.release();
    assertEquals(2, ids.size());
    var runs = trips.findByTripDateAndVehicleOrderByNumberAsc(first.getDeliveryDate(), vehicle);
    assertTrue(
        LocalTime.parse(runs.get(1).getDeparts())
            .isAfter(LocalTime.parse(runs.get(0).getDeparts())));
    assertTrue(runs.stream().mapToDouble(Trip::getReservedFuelL).sum() > 10);
  }

  @Test
  void mixedCartCreatesTwoOrdersAndRejectsSundayPastDates() {
    var p =
        store.place(
            sm,
            new StoreDtos.PlaceOrder(
                "2026-10-06",
                List.of(
                    new StoreDtos.CartItem(milk.getId(), 2),
                    new StoreDtos.CartItem(rice.getId(), 3))));
    assertEquals(2, p.orderCodes().size());
    assertEquals(25, p.weightKg());
    assertEquals(2, orders.count());
    assertTrue(
        assertThrows(
                ApiException.class,
                () ->
                    store.place(
                        sm,
                        new StoreDtos.PlaceOrder(
                            "2026-10-11", List.of(new StoreDtos.CartItem(rice.getId(), 1)))))
            .getMessage()
            .contains("Sunday"));
    assertTrue(
        assertThrows(
                ApiException.class,
                () ->
                    store.place(
                        sm,
                        new StoreDtos.PlaceOrder(
                            "2026-10-01", List.of(new StoreDtos.CartItem(rice.getId(), 1)))))
            .getMessage()
            .contains("past"));
  }

  @Test
  void constraintsRejectWrongDepotAmbientVanCapacityFuelAndThirdTrip() {
    var o = place(milk, 10);
    dispatcher.confirm(List.of(o.getId()));
    var kd = new Depot();
    kd.setCode("KDY");
    kd.setName("Kandy");
    depots.save(kd);
    vehicle.setDepot(kd);
    assertThrows(ApiException.class, () -> dispatcher.assign(o.getId(), vehicle.getId(), 1));
    vehicle.setDepot(depot);
    vehicle.setReefer(false);
    assertThrows(ApiException.class, () -> dispatcher.assign(o.getId(), vehicle.getId(), 1));
    vehicle.setReefer(true);
    outlet.setVanOnlyAccess(true);
    assertThrows(ApiException.class, () -> dispatcher.assign(o.getId(), vehicle.getId(), 1));
    outlet.setVanOnlyAccess(false);
    vehicle.setCapacityKg(10);
    assertThrows(ApiException.class, () -> dispatcher.assign(o.getId(), vehicle.getId(), 1));
    vehicle.setCapacityKg(6840);
    vehicle.setFuelQuotaL(1);
    assertThrows(ApiException.class, () -> dispatcher.assign(o.getId(), vehicle.getId(), 1));
    vehicle.setFuelQuotaL(430);
    assertThrows(ApiException.class, () -> dispatcher.assign(o.getId(), vehicle.getId(), 3));
    assertEquals(OrderStatus.CONFIRMED, o.getStatus());
    assertNull(o.getVehicle());
  }

  @Test
  void deferRequiresReasonNoteAndMovesSaturdayToMonday() {
    var o = place(rice, 10);
    o.setDeliveryDate(LocalDate.of(2026, 10, 10));
    dispatcher.confirm(List.of(o.getId()));
    assertThrows(ApiException.class, () -> release.defer(o.getId(), "capacity", ""));
    var d = release.defer(o.getId(), "capacity", "Capacity unavailable");
    assertEquals(LocalDate.of(2026, 10, 12), d.getRescheduledDate());
    assertEquals(OrderStatus.DEFERRED, o.getStatus());
    assertTrue(d.isStoreFacing());
  }

  @Test
  void refrigeratedVanServesVanOnlyOutletAndCrossDepotLoaderIsBlocked() {
    vehicle.setType(VehicleType.VAN);
    vehicle.setReefer(true);
    outlet.setVanOnlyAccess(true);
    var o = place(milk, 2);
    dispatcher.confirm(List.of(o.getId()));
    dispatcher.assign(o.getId(), vehicle.getId(), 1);
    var id = release.release().get(0);
    var kd = new Depot();
    kd.setCode("KDY");
    depots.save(kd);
    ld.setDepot(kd);
    assertThrows(ApiException.class, () -> loader.checkTripAccess(ld, id));
  }
}
