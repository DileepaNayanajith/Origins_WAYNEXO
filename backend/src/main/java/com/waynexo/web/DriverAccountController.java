package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.security.RequireRole;
import com.waynexo.service.DriverAccountService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dispatcher/fleet")
@RequireRole(Role.DISPATCHER)
public class DriverAccountController {
  private final DriverAccountService service;
  public DriverAccountController(DriverAccountService service) { this.service = service; }
  public record CreateDriver(String username, String fullName, String password) {}
  @PostMapping("/{vehicleId}/driver")
  public DriverAccountService.DriverAccount create(@PathVariable Long vehicleId, @RequestBody CreateDriver req) {
    return service.create(vehicleId, req.username(), req.fullName(), req.password());
  }
}
