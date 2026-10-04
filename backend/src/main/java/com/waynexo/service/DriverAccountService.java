package com.waynexo.service;

import com.waynexo.domain.*;
import com.waynexo.repo.*;
import com.waynexo.security.PasswordHasher;
import com.waynexo.web.ApiException;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverAccountService {
  private final AppUserRepository users;
  private final VehicleRepository vehicles;
  private final TripRepository trips;
  private final PasswordHasher hasher;

  public DriverAccountService(AppUserRepository users, VehicleRepository vehicles,
      TripRepository trips, PasswordHasher hasher) {
    this.users = users; this.vehicles = vehicles; this.trips = trips; this.hasher = hasher;
  }

  public record DriverAccount(Long id, String username, String fullName, String vehicleCode) {}

  @Transactional
  public DriverAccount create(Long vehicleId, String username, String fullName, String password) {
    if (username == null || !username.trim().matches("[A-Za-z0-9][A-Za-z0-9_-]{2,39}"))
      throw ApiException.badRequest("Username must contain 3–40 letters, numbers, underscores or hyphens");
    if (fullName == null || fullName.isBlank() || fullName.trim().length() > 80)
      throw ApiException.badRequest("Driver name must contain 1–80 characters");
    if (password == null || password.length() < 12 || password.length() > 128)
      throw ApiException.badRequest("Password must contain 12–128 characters");
    String login = username.trim().toLowerCase(Locale.ROOT);
    Vehicle vehicle = vehicles.findLockedById(vehicleId)
        .orElseThrow(() -> ApiException.notFound("Vehicle not found"));
    if (users.findByUsernameIgnoreCase(login).isPresent())
      throw ApiException.conflict("Username already exists", null);
    if (users.findAll().stream().anyMatch(u -> u.getRole() == Role.DRIVER
        && vehicle.getCode().equals(u.getVehicleCode())))
      throw ApiException.conflict("This vehicle already has a driver account", null);
    if (trips.existsByVehicleAndStatusNot(vehicle, TripStatus.COMPLETED))
      throw ApiException.conflict("Complete released trips before creating a driver for this vehicle", null);
    AppUser driver = new AppUser();
    driver.setUsername(login); driver.setFullName(fullName.trim()); driver.setRole(Role.DRIVER);
    driver.setTitle("Driver"); driver.setVehicleCode(vehicle.getCode()); driver.setDepot(vehicle.getDepot());
    driver.setPasswordHash(hasher.hash(password));
    users.save(driver);
    vehicle.setDriverName(driver.getFullName());
    return new DriverAccount(driver.getId(), driver.getUsername(), driver.getFullName(), driver.getVehicleCode());
  }
}
