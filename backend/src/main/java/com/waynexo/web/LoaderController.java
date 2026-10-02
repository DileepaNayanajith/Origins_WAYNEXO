package com.waynexo.web;

import com.waynexo.domain.Role;
import com.waynexo.dto.LoaderDtos.*;
import com.waynexo.security.AuthContext;
import com.waynexo.security.RequireRole;
import com.waynexo.service.LoaderService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/loader")
@RequireRole(Role.LOADER)
public class LoaderController {

    private final LoaderService service;
    private final AuthContext auth;

    public LoaderController(LoaderService service, AuthContext auth) { this.service = service; this.auth = auth; }

    @GetMapping("/queue")
    public DockQueue queue() { return service.queue(auth.user()); }

    @GetMapping("/trips/{id}/manifest")
    public Manifest manifest(@PathVariable Long id) { return service.manifest(id); }

    @PostMapping("/trips/{id}/precool")
    public Map<String, Boolean> precool(@PathVariable Long id) { service.precool(id); return Map.of("ok", true); }

    @GetMapping("/stops/{id}/verification")
    public Verification verification(@PathVariable Long id) { return service.verification(id); }

    @PutMapping("/items/{id}")
    public Verification item(@PathVariable Long id, @RequestBody ItemUpdate update) { return service.updateItem(id, update); }

    @PostMapping("/stops/{id}/flag-shortfall")
    public Verification flag(@PathVariable Long id) { return service.flagShortfall(auth.user(), id); }

    @PostMapping("/stops/{id}/verify")
    public Verification verify(@PathVariable Long id) { return service.verifyStop(id); }

    @GetMapping("/trips/{id}/dispatch")
    public DispatchView dispatchView(@PathVariable Long id) { return service.dispatchView(id); }

    @PostMapping("/trips/{id}/dispatch")
    public DispatchView dispatch(@PathVariable Long id) { return service.dispatch(auth.user(), id); }
}
