package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.dto.DispatcherDtos.*;
import com.waynexo.security.RequireRole;
import com.waynexo.service.DispatcherService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dispatcher")
@RequireRole(Role.DISPATCHER)
public class DispatcherController {

    private final DispatcherService service;

    public DispatcherController(DispatcherService service) { this.service = service; }

    @GetMapping("/overview")
    public Overview overview() { return service.overview(); }

    @GetMapping("/orders")
    public OrdersPage orders(@RequestParam(required = false) String brand, @RequestParam(required = false) String district,
                             @RequestParam(required = false) String status) {
        return service.orders(brand, district, status);
    }

    @PostMapping("/orders/confirm")
    public Map<String, Integer> confirm(@RequestBody IdsRequest req) { return Map.of("updated", service.confirm(req.ids())); }

    @GetMapping("/orders/export.csv")
    public ResponseEntity<String> export(@RequestParam(required = false) String brand, @RequestParam(required = false) String district,
                                         @RequestParam(required = false) String status) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=waynexo-orders.csv")
                .contentType(new MediaType("text", "csv"))
                .body(service.exportCsv(brand, district, status));
    }

    @GetMapping("/planning")
    public Planning planning() { return service.planning(); }

    @PostMapping("/planning/assign")
    public BuilderVehicle assign(@RequestBody AssignRequest req) { return service.assign(req.orderId(), req.vehicleId()); }

    @PostMapping("/planning/unassign")
    public Map<String, Boolean> unassign(@RequestBody AssignRequest req) { service.unassign(req.orderId()); return Map.of("ok", true); }

    @DeleteMapping("/planning/conflicts/{id}")
    public Map<String, Boolean> dismiss(@PathVariable Long id) { service.dismissConflict(id); return Map.of("ok", true); }

    @GetMapping("/fleet")
    public Fleet fleet(@RequestParam(required = false) String type, @RequestParam(required = false) String depot,
                       @RequestParam(required = false) String state) {
        return service.fleet(type, depot, state);
    }

    @GetMapping("/tracking")
    public Tracking tracking() { return service.tracking(); }

    @GetMapping("/deferrals")
    public Deferrals deferrals() { return service.deferrals(); }

    @PostMapping("/deferrals/{id}/resolve")
    public Map<String, Boolean> resolve(@PathVariable Long id) { service.resolve(id); return Map.of("ok", true); }

    @PutMapping("/deferrals/{id}/note")
    public Map<String, Boolean> note(@PathVariable Long id, @RequestBody NoteRequest req) { service.note(id, req.note()); return Map.of("ok", true); }
}
