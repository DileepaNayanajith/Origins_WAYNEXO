package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.security.RequireRole;
import com.waynexo.service.PlanReleaseService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dispatcher")
@RequireRole(Role.DISPATCHER)
public class PlanningOperationsController {
  private final PlanReleaseService service;

  public PlanningOperationsController(PlanReleaseService service) {
    this.service = service;
  }

  public record DeferRequest(String reason, String note) {}

  @PostMapping("/planning/release")
  public Map<String, Object> release(@RequestParam(required = false) Long vehicleId) {
    return Map.of("tripIds", service.release(vehicleId));
  }

  @PostMapping("/planning/auto-allocate")
  public Map<String, Integer> allocate() {
    return service.autoAllocate();
  }

  @PostMapping("/orders/{id}/defer")
  public Map<String, Object> defer(@PathVariable Long id, @RequestBody DeferRequest req) {
    return Map.of("deferralId", service.defer(id, req.reason(), req.note()).getId());
  }
}
