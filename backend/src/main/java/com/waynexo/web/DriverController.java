package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.dto.DriverDtos.*;
import com.waynexo.security.AuthContext;
import com.waynexo.security.RequireRole;
import com.waynexo.service.DriverService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/driver")
@RequireRole(Role.DRIVER)
public class DriverController {

    private final DriverService service;
    private final AuthContext auth;

    public DriverController(DriverService service, AuthContext auth) { this.service = service; this.auth = auth; }

    @GetMapping("/home")
    public Home home() { return service.home(auth.user()); }

    @PostMapping("/trips/{id}/start")
    public TripView start(@PathVariable Long id) { return service.startTrip(auth.user(), id); }

    @GetMapping("/trips/{id}")
    public TripView trip(@PathVariable Long id) { return service.trip(auth.user(), id); }

    @GetMapping("/stops/{id}")
    public StopView stop(@PathVariable Long id) { return service.stop(auth.user(), id); }

    @PostMapping("/stops/{id}/arrive")
    public StopView arrive(@PathVariable Long id) { return service.arrive(auth.user(), id); }

    @PostMapping("/stops/{id}/pod")
    public PodResult pod(@PathVariable Long id, @RequestBody PodRequest req) { return service.pod(auth.user(), id, req); }

    @PostMapping("/exceptions")
    public Map<String, Object> exception(@RequestBody ExceptionRequest req) { return service.reportException(auth.user(), req); }

    @PostMapping("/sync")
    public SyncResult sync(@RequestBody SyncRequest req) { return service.sync(auth.user(), req); }
}
