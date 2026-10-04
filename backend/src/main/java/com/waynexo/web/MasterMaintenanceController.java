package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.security.RequireRole;
import com.waynexo.service.MasterUpgradeService;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dispatcher/maintenance")
@RequireRole(Role.DISPATCHER)
@ConditionalOnProperty(name = "waynexo.maintenance-enabled", havingValue = "true")
public class MasterMaintenanceController {
  private final MasterUpgradeService service;

  public MasterMaintenanceController(MasterUpgradeService service) {
    this.service = service;
  }

  public record ApplyRequest(String backupHash, boolean cleanupQa) {}

  @GetMapping("/preview")
  public Map<String, Object> preview() throws Exception {
    return service.preview();
  }

  @PostMapping("/apply")
  public Map<String, Object> apply(@RequestBody ApplyRequest req) throws Exception {
    return service.apply(req.backupHash(), req.cleanupQa());
  }
}
