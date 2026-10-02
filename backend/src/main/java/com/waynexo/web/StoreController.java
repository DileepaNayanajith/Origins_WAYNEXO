package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.dto.StoreDtos.*;
import com.waynexo.security.AuthContext;
import com.waynexo.security.RequireRole;
import com.waynexo.service.StoreService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store")
@RequireRole(Role.STORE_MANAGER)
public class StoreController {

    private final StoreService service;
    private final AuthContext auth;

    public StoreController(StoreService service, AuthContext auth) { this.service = service; this.auth = auth; }

    @GetMapping("/catalog")
    public Catalog catalog() { return service.catalog(auth.user()); }

    @PostMapping("/orders")
    public Placed place(@RequestBody PlaceOrder req) { return service.place(auth.user(), req); }

    @GetMapping("/orders")
    public List<HistoryRow> history(@RequestParam(required = false) String status, @RequestParam(required = false) String brand) {
        return service.history(auth.user(), status, brand);
    }

    @GetMapping("/schedule")
    public Schedule schedule() { return service.schedule(auth.user()); }

    @GetMapping("/receiving")
    public Map<String, Receiving> receiving() {
        return java.util.Collections.singletonMap("delivery", service.receiving(auth.user()));
    }

    @PostMapping("/receiving/{orderId}")
    public Map<String, Boolean> receive(@PathVariable Long orderId, @RequestBody ReceiveRequest req) {
        service.receive(auth.user(), orderId, req);
        return Map.of("ok", true);
    }

    @GetMapping("/deferral")
    public Map<String, DeferralAlert> deferral(@RequestParam(required = false) Long id) {
        return java.util.Collections.singletonMap("deferral", service.activeDeferral(auth.user(), id));
    }

    @PostMapping("/deferrals/{id}/acknowledge")
    public Map<String, Boolean> acknowledge(@PathVariable Long id) { service.acknowledge(auth.user(), id); return Map.of("ok", true); }
}
